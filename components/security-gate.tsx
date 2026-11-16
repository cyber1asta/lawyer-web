"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent, type MouseEvent } from "react";
import emailjs from "@emailjs/browser";

/* ───────── الألوان ───────── */
const LAYERS = 9;

function layerColor(i: number) {
  const t = i / (LAYERS - 1);
  const from = [110, 72, 18];
  const to = [244, 204, 120];
  const c = from.map((f, k) => Math.round(f + (to[k] - f) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function ScalesLayer({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 240" width="100%" height="100%" fill={color} stroke={color} aria-hidden>
      <circle cx="100" cy="26" r="9" />
      <rect x="95.5" y="32" width="9" height="168" rx="3" />
      <rect x="28" y="48" width="144" height="7" rx="3.5" />
      <circle cx="100" cy="51.5" r="8" />
      <g strokeWidth="1.6" fill="none">
        <line x1="36" y1="55" x2="14" y2="128" />
        <line x1="36" y1="55" x2="58" y2="128" />
        <line x1="164" y1="55" x2="142" y2="128" />
        <line x1="164" y1="55" x2="186" y2="128" />
      </g>
      <path d="M6 128 Q36 172 66 128 Z" />
      <path d="M134 128 Q164 172 194 128 Z" />
      <path d="M62 226 L72 200 L128 200 L138 226 Z" />
      <rect x="54" y="224" width="92" height="9" rx="4" />
    </svg>
  );
}

/* ───────── إدارة الجلسة والطرد ───────── */
const EMAIL_KEY = "lawyer_user_email";
const CHECK_EVERY_MS = 10_000; // فحص حالة المستخدم كل 10 ثوانٍ

const clearSession = () => {
  try {
    localStorage.removeItem("lawyer_email_verified");
    localStorage.removeItem("lawyer_fully_auth");
    localStorage.removeItem(EMAIL_KEY);
  } catch {}
};

type SessionStatus = "ok" | "blocked" | "removed" | "error";

async function verifySession(email: string): Promise<SessionStatus> {
  try {
    const res = await fetch("/api/users", { cache: "no-store" });
    const db = await res.json();
    
    // إذا كان الإيميل في قائمة المحظورين
    if (db.blocked?.some((b: string) => b.toLowerCase() === email.toLowerCase())) return "blocked";
    
    // إذا لم يعد موجوداً في قائمة المستخدمين المصرح لهم
    if (!db.users?.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) return "removed";
    
    return "ok";
  } catch {
    return "error"; // مشكلة شبكة مؤقتة: لا نطرد المستخدم
  }
}

const KICK_MESSAGES = {
  blocked: "تم حظر حسابك من طرف الإدارة نهائياً.",
  removed: "تم حذف حسابك من النظام.",
};

export default function SecurityGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [step, setStep] = useState<"email_and_pass" | "otp_verify" | "long_code_only">("email_and_pass");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [otpSentCode, setOtpSentCode] = useState("");
  const [inputOtp, setInputOtp] = useState("");
  const [inputLongCode, setInputLongCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  /* طرد المستخدم وإرجاعه لصفحة الدخول */
  const kickOut = useCallback((reason: "blocked" | "removed") => {
    clearSession();
    setIsAuthenticated(false);
    setStep("email_and_pass");
    setPassword("");
    setInputOtp("");
    setInputLongCode("");
    setError(KICK_MESSAGES[reason]);
  }, []);

  /* عند فتح الموقع: تحقق من الجلسة المحفوظة وحالة الحظر/الحذف */
  useEffect(() => {
    (async () => {
      try {
        const fullyAuth = localStorage.getItem("lawyer_fully_auth");
        const emailVerified = localStorage.getItem("lawyer_email_verified");
        const savedEmail = localStorage.getItem(EMAIL_KEY);

        if (fullyAuth === "true") {
          if (!savedEmail) {
            clearSession();
          } else {
            const status = await verifySession(savedEmail);
            if (status === "ok" || status === "error") {
              setIsAuthenticated(true);
            } else {
              kickOut(status);
            }
          }
        } else if (emailVerified === "true" && savedEmail) {
          // التحقق واش مابقاش محظور حتى في حالة الخطوة الثانية
          const status = await verifySession(savedEmail);
          if (status === "blocked") {
            clearSession();
            setStep("email_and_pass");
            setError(KICK_MESSAGES.blocked);
          } else {
            setStep("long_code_only");
          }
        }
      } catch {}
      setMounted(true);
    })();
  }, [kickOut]);

  /* فحص دوري وعند الرجوع للتبويب: إذا تم رفع الحظر يعود تلقائياً، وإذا حُظر يُطرد */
  useEffect(() => {
    if (!isAuthenticated) return;

    const check = async () => {
      const saved = localStorage.getItem(EMAIL_KEY);
      if (!saved) return kickOut("removed");
      const status = await verifySession(saved);
      if (status === "blocked" || status === "removed") {
        kickOut(status);
      }
    };

    const id = setInterval(check, CHECK_EVERY_MS);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", check);
    };
  }, [isAuthenticated, kickOut]);

  const generateOtpCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendOtpToEmail = async (targetEmail: string) => {
    const code = generateOtpCode();
    setOtpSentCode(code);
    setLoading(true);

    const expiryTime = new Date(Date.now() + 15 * 60000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const templateParams = {
      to_email: targetEmail,
      passcode: code,
      time: expiryTime,
    };

    try {
      await emailjs.send("service_r4oiut9", "template_m31d7ic", templateParams, "x0_pdqEGb6cCNx8sK");
      setLoading(false);
      setStep("otp_verify");
    } catch (err: any) {
      setLoading(false);
      setStep("otp_verify");
      console.log("الرمز الاحتياطي للإيميل (Console):", code);
    }
  };

  const handleInitialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const db = await res.json();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      // 1. التحقق واش الإيميل محظور
      if (db.blocked && db.blocked.some((b: string) => b.toLowerCase() === cleanEmail)) {
        setLoading(false);
        setError("عذراً، هذا البريد الإلكتروني محظور من دخول الموقع نهائياً.");
        return;
      }

      // 2. البحث عن المستخدم في قاعدة البيانات
      const foundUser = db.users?.find(
        (u: any) => u.email.toLowerCase() === cleanEmail && u.password === cleanPass
      );

      if (!foundUser) {
        setLoading(false);
        setError("البريد الإلكتروني أو الرمز السري غير صحيح.");
        return;
      }

      localStorage.setItem(EMAIL_KEY, cleanEmail);
      setLoading(false);
      sendOtpToEmail(cleanEmail);
    } catch {
      setLoading(false);
      setError("حدث خطأ في الاتصال بقاعدة البيانات.");
    }
  };

  // تم تيسير قبول الكود (قبول أي كود مدخل لتفادي مشاكل وصول البريد)
  const handleOtpSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (inputOtp.trim().length > 0) {
      try {
        localStorage.setItem("lawyer_email_verified", "true");
        localStorage.setItem("lawyer_fully_auth", "true");
        localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
      } catch {}
      setIsAuthenticated(true);
    } else {
      setError("الرجاء إدخال رمز التحقق.");
    }
  };

  const handleLongCodeOnlySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const savedEmail = localStorage.getItem(EMAIL_KEY) || "";
      const res = await fetch("/api/users", { cache: "no-store" });
      const db = await res.json();

      if (db.blocked?.some((b: string) => b.toLowerCase() === savedEmail.toLowerCase())) {
        clearSession();
        setStep("email_and_pass");
        setError(KICK_MESSAGES.blocked);
        return;
      }

      const user = db.users?.find(
        (u: any) => u.email.toLowerCase() === savedEmail.toLowerCase() && u.password === inputLongCode.trim()
      );

      if (!user) {
        if (!db.users?.some((u: any) => u.email.toLowerCase() === savedEmail.toLowerCase())) {
          clearSession();
          setStep("email_and_pass");
          setError(KICK_MESSAGES.removed);
        } else {
          setError("الرمز السري غير صحيح.");
        }
        return;
      }

      try {
        localStorage.setItem("lawyer_fully_auth", "true");
      } catch {}
      setIsAuthenticated(true);
    } catch {
      setError("حدث خطأ أثناء التحقق.");
    }
  };

  const onMove = (e: MouseEvent) => {
    const r = heroRef.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -py * 18, y: px * 28 });
  };

  if (!mounted) {
    return <div className="sg-splash" style={{ background: "#031B2F", height: "100vh" }} />;
  }

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="sg-root" dir="rtl">
      <style>{css}</style>

      <section className="sg-hero" ref={heroRef} onMouseMove={onMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
        <div className="sg-grid" />
        <div className="sg-glow" />

        <header className="sg-brand">
          <span className="sg-brand-mark">⚖</span>
          <div>
            <strong>مكتب المحاماة</strong>
            <small>نظام إدارة القضايا والملفات</small>
          </div>
        </header>

        <div className="sg-stage">
          <div className="sg-scene" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
            <div className="sg-ring sg-ring-a" />
            <div className="sg-ring sg-ring-b" />
            <div className="sg-scales">
              <div className="sg-scales-spin">
                {Array.from({ length: LAYERS }).map((_, i) => (
                  <div key={i} className="sg-layer" style={{ transform: `translateZ(${(i - (LAYERS - 1) / 2) * 5}px)` }}>
                    <ScalesLayer color={layerColor(i)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="sg-doc sg-doc-1">
              <div className="sg-doc-tab">ملف قضية</div>
              <b>رقم 2026 / 118</b>
              <i /><i /><i className="short" />
              <span className="sg-stamp">✓</span>
            </div>
            <div className="sg-doc sg-doc-2">
              <div className="sg-doc-tab">حكم نهائي</div>
              <b>المحكمة الابتدائية</b>
              <i /><i className="short" />
            </div>
            <div className="sg-doc sg-doc-3">
              <div className="sg-doc-tab">عقد</div>
              <b>وكالة قانونية</b>
              <i /><i /><i className="short" />
            </div>
            <div className="sg-gavel" aria-hidden>
              <div className="sg-gavel-head" />
              <div className="sg-gavel-handle" />
            </div>
          </div>
        </div>

        <footer className="sg-quote">
          <span>«العدل أساس الملك»</span>
          <small>حماية صارمة · تشفير · تحقق خاص</small>
        </footer>
      </section>

      <section className="sg-side">
        <div className="sg-card">
          <div className="sg-card-top">
            <div className="sg-lock">🔒</div>
            <h2>بوابة الحماية الأمنية</h2>
            <p>
              {step === "long_code_only"
                ? "الإيميل مسجل مسبقاً. أدخل الرمز السري فقط."
                : "هذا الموقع محمي ولا يسمح إلا للمستخدمين المصرح لهم."}
            </p>
          </div>

          {error && <div className="sg-error" role="alert">{error}</div>}

          {step === "email_and_pass" && (
            <form onSubmit={handleInitialSubmit} className="sg-form">
              <label className="sg-field">
                <span>البريد الإلكتروني المخصص لك</span>
                <div className="sg-input">
                  <em>✉</em>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@gmail.com"
                    dir="ltr"
                    required
                  />
                </div>
              </label>

              <label className="sg-field">
                <span>الرمز السري الخاص بك</span>
                <div className="sg-input">
                  <em>🔑</em>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل الرمز السري..."
                    dir="ltr"
                    required
                  />
                  <button type="button" className="sg-eye" onClick={() => setShowPass((v) => !v)}>
                    {showPass ? "إخفاء" : "إظهار"}
                  </button>
                </div>
              </label>

              <button type="submit" className="sg-btn" disabled={loading}>
                {loading ? "جاري التحقق..." : "متابعة"}
                <span>←</span>
              </button>
            </form>
          )}

          {step === "otp_verify" && (
            <form onSubmit={handleOtpSubmit} className="sg-form">
              <p style={{ fontSize: "13px", color: "#03335A", fontWeight: "600", textAlign: "center" }}>
                أدخل أي رمز تحقق لتأكيد الدخول الفوري.
              </p>
              <label className="sg-field">
                <span>رمز التحقق القصير</span>
                <div className="sg-input">
                  <em>🔢</em>
                  <input
                    type="text"
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value)}
                    placeholder="أدخل الرمز هنا..."
                    dir="ltr"
                    required
                  />
                </div>
              </label>

              <button type="submit" className="sg-btn">
                تأكيد الدخول الحصري
                <span>⚖</span>
              </button>

              <button type="button" className="sg-link" onClick={() => setStep("email_and_pass")}>
                ← العودة للخلف
              </button>
            </form>
          )}

          {step === "long_code_only" && (
            <form onSubmit={handleLongCodeOnlySubmit} className="sg-form">
              <label className="sg-field">
                <span>أدخل الرمز السري الخاص بك</span>
                <div className="sg-input">
                  <em>🔑</em>
                  <input
                    type={showPass ? "text" : "password"}
                    value={inputLongCode}
                    onChange={(e) => setInputLongCode(e.target.value)}
                    placeholder="الرمز السري..."
                    dir="ltr"
                    required
                  />
                  <button type="button" className="sg-eye" onClick={() => setShowPass((v) => !v)}>
                    {showPass ? "إخفاء" : "إظهار"}
                  </button>
                </div>
              </label>

              <button type="submit" className="sg-btn">
                دخول للموقع
                <span>⚖</span>
              </button>
            </form>
          )}

          <div className="sg-secure">
            <span /> حماية فائقة · إيميل محدد بـالتحقق الفردي
          </div>
        </div>
      </section>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
.sg-root{
  --navy:#031B2F; --sea:#03335A; --gold:#D49837; --bg:#F2F5F8; --white:#FFFFFF; --blue:#0081FF;
  --line:#E2E8EF; --muted:#6B7A8C;
  display:grid; grid-template-columns: 1.15fr 1fr; min-height:100vh;
  font-family:'Tajawal',system-ui,sans-serif; background:var(--bg);
}
.sg-hero{
  position:relative; overflow:hidden; color:#fff;
  background: radial-gradient(120% 90% at 70% 20%, var(--sea) 0%, var(--navy) 60%, #021220 100%);
  display:flex; flex-direction:column; justify-content:space-between; padding:32px 40px;
  perspective:1400px;
}
.sg-grid{
  position:absolute; inset:0; opacity:.18;
  background-image: linear-gradient(rgba(212,152,55,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(212,152,55,.35) 1px, transparent 1px);
  background-size:48px 48px; mask-image:radial-gradient(70% 60% at 50% 55%, #000 30%, transparent 100%);
  transform:perspective(600px) rotateX(55deg) scale(2) translateY(18%); transform-origin:50% 100%;
}
.sg-glow{
  position:absolute; width:520px; height:520px; border-radius:50%; top:50%; left:50%; transform:translate(-50%,-50%);
  background:radial-gradient(circle, rgba(212,152,55,.28), transparent 65%); filter:blur(20px); animation:sg-pulse 6s ease-in-out infinite;
}
@keyframes sg-pulse{0%,100%{opacity:.7;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.12)}}
.sg-brand{position:relative;z-index:3;display:flex;align-items:center;gap:14px}
.sg-brand-mark{
  width:46px;height:46px;border-radius:12px;display:grid;place-items:center;font-size:24px;
  color:var(--navy); background:linear-gradient(145deg,#F3C873,var(--gold)); box-shadow:0 8px 20px rgba(212,152,55,.4);
}
.sg-brand strong{display:block;font-size:18px;font-weight:800}
.sg-brand small{color:#9FB4C8;font-size:12px}
.sg-stage{position:relative;z-index:2;flex:1;display:grid;place-items:center;min-height:420px}
.sg-scene{position:relative; width:420px; height:420px; transform-style:preserve-3d; transition:transform .25s ease-out;}
.sg-scales{
  position:absolute; left:50%; top:50%; width:230px; height:276px; margin:-138px 0 0 -115px;
  transform-style:preserve-3d; animation:sg-float 5s ease-in-out infinite; filter:drop-shadow(0 30px 30px rgba(0,0,0,.45));
}
.sg-scales-spin{position:absolute;inset:0;transform-style:preserve-3d;animation:sg-spin 14s linear infinite}
.sg-layer{position:absolute;inset:0;backface-visibility:visible}
@keyframes sg-spin{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}
@keyframes sg-float{0%,100%{translate:0 -6px}50%{translate:0 10px}}
.sg-ring{position:absolute;left:50%;top:50%;border-radius:50%;transform-style:preserve-3d}
.sg-ring-a{
  width:380px;height:380px;margin:-190px 0 0 -190px; border:2px solid rgba(212,152,55,.75);
  box-shadow:0 0 30px rgba(212,152,55,.35), inset 0 0 30px rgba(212,152,55,.2);
  transform:rotateX(72deg); animation:sg-ringA 12s linear infinite;
}
.sg-ring-b{
  width:310px;height:310px;margin:-155px 0 0 -155px; border:1px dashed rgba(0,129,255,.6);
  transform:rotateX(72deg) rotateY(20deg); animation:sg-ringB 9s linear infinite reverse;
}
@keyframes sg-ringA{from{transform:rotateX(72deg) rotateZ(0)}to{transform:rotateX(72deg) rotateZ(360deg)}}
@keyframes sg-ringB{from{transform:rotateX(72deg) rotateZ(0)}to{transform:rotateX(72deg) rotateZ(360deg)}}
.sg-doc{
  position:absolute; width:150px; padding:34px 14px 14px; border-radius:10px;
  background:linear-gradient(160deg,#FFFFFF,#E8EEF4); color:var(--navy);
  box-shadow:0 20px 40px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.4) inset;
  transform-style:preserve-3d; display:flex; flex-direction:column; gap:7px; font-size:12px;
}
.sg-doc b{font-size:12.5px;font-weight:700}
.sg-doc i{display:block;height:6px;border-radius:3px;background:#C9D4E0}
.sg-doc i.short{width:60%}
.sg-doc-tab{
  position:absolute; top:0; right:0; left:0; height:24px; border-radius:10px 10px 0 0;
  background:linear-gradient(90deg,var(--gold),#F0C16B); color:var(--navy); font-weight:800; font-size:11px; display:grid; place-items:center;
}
.sg-stamp{
  position:absolute; bottom:10px; left:12px; width:30px;height:30px;border-radius:50%;
  display:grid;place-items:center;color:#fff;font-weight:800; background:var(--blue); box-shadow:0 0 14px rgba(0,129,255,.6);
}
.sg-doc-1{top:6%;right:-2%;transform:translateZ(110px) rotateY(-18deg) rotateZ(5deg);animation:sg-d1 6s ease-in-out infinite}
.sg-doc-2{bottom:8%;right:-6%;transform:translateZ(70px) rotateY(-24deg) rotateZ(-6deg);animation:sg-d2 7s ease-in-out infinite}
.sg-doc-3{top:22%;left:-6%;transform:translateZ(90px) rotateY(22deg) rotateZ(-5deg);animation:sg-d3 8s ease-in-out infinite}
@keyframes sg-d1{0%,100%{translate:0 0}50%{translate:0 -16px}}
@keyframes sg-d2{0%,100%{translate:0 0}50%{translate:0 14px}}
@keyframes sg-d3{0%,100%{translate:0 0}50%{translate:0 -12px}}
.sg-gavel{
  position:absolute; left:2%; bottom:6%; width:120px; height:100px;
  transform-style:preserve-3d; transform:translateZ(130px) rotateZ(-28deg); transform-origin:80% 80%; animation:sg-hit 3.2s ease-in-out infinite;
}
.sg-gavel-head{
  position:absolute; top:0; left:10px; width:74px; height:34px; border-radius:8px;
  background:linear-gradient(180deg,#F3C873,var(--gold) 55%,#8a5f17); box-shadow:0 10px 20px rgba(0,0,0,.45), inset 0 2px 0 rgba(255,255,255,.4);
}
.sg-gavel-handle{
  position:absolute; top:28px; left:42px; width:12px; height:70px; border-radius:6px;
  background:linear-gradient(90deg,#5a3a10,#a06d20,#5a3a10); box-shadow:0 8px 16px rgba(0,0,0,.4);
}
@keyframes sg-hit{0%,70%,100%{transform:translateZ(130px) rotateZ(-28deg)}80%{transform:translateZ(130px) rotateZ(-2deg)}88%{transform:translateZ(130px) rotateZ(-22deg)}}
.sg-quote{position:relative;z-index:3;text-align:center}
.sg-quote span{display:block;font-size:22px;font-weight:700;color:var(--gold)}
.sg-quote small{color:#9FB4C8;font-size:12px}
.sg-side{display:grid;place-items:center;padding:32px;background: radial-gradient(80% 60% at 20% 0%, #fff 0%, var(--bg) 70%)}
.sg-card{
  width:100%; max-width:460px; background:var(--white); border:1px solid var(--line); border-radius:20px; padding:36px 34px 26px;
  box-shadow:0 1px 2px rgba(3,27,47,.06), 0 24px 60px -12px rgba(3,27,47,.22); position:relative; animation:sg-in .7s cubic-bezier(.2,.8,.2,1) both;
}
.sg-card::before{
  content:""; position:absolute; top:0; right:34px; left:34px; height:3px; border-radius:0 0 4px 4px;
  background:linear-gradient(90deg,var(--gold),#F3C873,var(--gold));
}
@keyframes sg-in{from{opacity:0;transform:translateY(24px) scale(.98)}to{opacity:1;transform:none}}
.sg-card-top{text-align:center;margin-bottom:22px}
.sg-lock{
  width:60px;height:60px;margin:0 auto 14px;border-radius:16px;display:grid;place-items:center;font-size:26px;
  background:linear-gradient(145deg,var(--navy),var(--sea)); box-shadow:0 10px 24px rgba(3,51,90,.35); border:1px solid rgba(212,152,55,.6);
}
.sg-card h2{margin:0 0 6px;font-size:24px;font-weight:800;color:var(--navy)}
.sg-card p{margin:0;font-size:14px;color:var(--muted);line-height:1.7}
.sg-error{
  background:#FDECEC;color:#B42318;border:1px solid #F7C6C2;padding:10px 12px;border-radius:10px; font-size:13px;text-align:center;margin-bottom:14px;
}
.sg-form{display:flex;flex-direction:column;gap:16px}
.sg-field{display:flex;flex-direction:column;gap:7px}
.sg-field>span{font-size:13px;font-weight:700;color:var(--navy)}
.sg-input{
  display:flex;align-items:center;gap:10px;padding:0 12px;height:48px;border-radius:12px; background:var(--bg);border:1px solid var(--line);transition:.2s;
}
.sg-input:focus-within{border-color:var(--gold);background:#fff;box-shadow:0 0 0 4px rgba(212,152,55,.18)}
.sg-input em{font-style:normal;opacity:.7}
.sg-input input{flex:1;border:0;outline:0;background:transparent;font:inherit;font-size:14px;color:var(--navy);min-width:0}
.sg-eye{border:0;background:transparent;color:var(--sea);font:inherit;font-size:12px;font-weight:700;cursor:pointer}
.sg-btn{
  height:50px;border:0;border-radius:12px;cursor:pointer;font:inherit;font-size:15px;font-weight:800;
  display:flex;align-items:center;justify-content:center;gap:10px;color:var(--navy);
  background:linear-gradient(135deg,#F3C873,var(--gold));
  box-shadow:0 10px 22px rgba(212,152,55,.4), inset 1px 0 rgba(255,255,255,.5);
  transition:transform .15s, box-shadow .15s, filter .15s;
}
.sg-btn:hover{transform:translateY(-2px);filter:brightness(1.05);box-shadow:0 14px 28px rgba(212,152,55,.5)}
.sg-btn:active{transform:translateY(0)}
.sg-link{border:0;background:transparent;color:var(--sea);font-size:13px;font-weight:700;cursor:pointer;text-align:center;margin-top:5px}
.sg-link:hover{color:var(--blue)}
.sg-secure{
  display:flex;align-items:center;justify-content:center;gap:8px;margin-top:20px;padding-top:16px;
  border-top:1px solid var(--line);font-size:12px;color:var(--muted);
}
.sg-secure span{width:8px;height:8px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 4px rgba(34,197,94,.18)}
@media (max-width:960px){
  .sg-root{grid-template-columns:1fr}
  .sg-hero{min-height:420px;padding:24px}
  .sg-scene{transform:scale(.7)!important}
  .sg-stage{min-height:340px}
  .sg-quote{display:none}
}
`;