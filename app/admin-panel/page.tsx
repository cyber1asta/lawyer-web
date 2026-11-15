"use client";

import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from "react";
import {
  ShieldCheck,
  Lock,
  UserPlus,
  Trash2,
  Ban,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  Mail,
  AlertTriangle,
  Eye,
  EyeOff,
  Users,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   الأنواع والثوابت
────────────────────────────────────────────────────────────── */

interface UserRecord {
  email: string;
  password: string;
  status: "active" | "blocked";
}

const ADMIN_PANEL_SECRET_CODE = "MASTER-ADMIN-2026";

/* ──────────────────────────────────────────────────────────────
   FullBleed
   يلغي الحشوة (padding) الخاصة بالـ layout حتى يملأ هذا الإطار
   الحواف البيضاء داخل منطقة المحتوى فقط (بدون تغطية القائمة الجانبية).
   الحشوة الحالية في الـ layout = 32px = p-8  →  نلغيها بـ -m-8
   إذا غيّرت الحشوة في layout.tsx غيّر -m-8 إلى ما يناسبها.
────────────────────────────────────────────────────────────── */

function FullBleed({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`-m-8 min-h-screen ${className}`}>{children}</div>;
}

/* ──────────────────────────────────────────────────────────────
   شاشة القفل
────────────────────────────────────────────────────────────── */

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (secret.trim() === ADMIN_PANEL_SECRET_CODE) {
      setError("");
      onUnlock();
    } else {
      setError("الكود السري الخاص بصفحة الإدارة غير صحيح!");
    }
  };

  return (
    <FullBleed className="relative flex items-center justify-center overflow-hidden bg-[#031B2F] p-6 font-sans">
      {/* خلفية منقطة + توهج ذهبي */}
      <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(#D49837_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="pointer-events-none absolute h-[480px] w-[480px] rounded-full bg-[#D49837]/10 blur-3xl" />

      <div dir="rtl" className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#031B2F]/90 p-8 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F3C873] to-[#D49837] text-[#031B2F] shadow-lg shadow-[#D49837]/20">
          <Lock className="size-8" />
        </div>

        <h1 className="mb-2 text-2xl font-extrabold text-white">منطقة الحماية العليا</h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-300">
          منطقة محظورة ومخصصة لإدارة صلاحيات النظام وأمن البوابة. أدخل الكود السري للمتابعة.
        </p>

        {error && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-400">
            <AlertTriangle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-slate-400">
              <KeyRound className="size-5" />
            </span>
            <input
              type="password"
              placeholder="أدخل الكود السري للإدارة..."
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              dir="ltr"
              required
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pe-4 ps-12 text-sm text-white placeholder-slate-400 transition focus:border-[#D49837] focus:outline-none focus:ring-2 focus:ring-[#D49837]/20"
            />
          </div>

          <button
            type="submit"
            className="h-12 w-full rounded-xl bg-gradient-to-r from-[#F3C873] to-[#D49837] font-extrabold text-[#031B2F] shadow-lg shadow-[#D49837]/20 transition hover:brightness-105 active:scale-[0.99]"
          >
            فتح لوحة التحكم الآمنة
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/10 pt-6 text-xs text-slate-400">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          نظام مشفر وعالي الحماية · 2026
        </div>
      </div>
    </FullBleed>
  );
}

/* ──────────────────────────────────────────────────────────────
   مكوّنات لوحة التحكم
────────────────────────────────────────────────────────────── */

function PanelHeader() {
  return (
    <header className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
      <div>
        <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D49837]">
          <ShieldCheck className="size-4" /> مركز التحكم والسيادة الأمنية
        </div>
        <h1 className="text-2xl font-black text-[#031B2F]">إدارة المستخدمين والصلاحيات</h1>
      </div>
      <a
        href="/"
        className="flex items-center gap-2 rounded-xl bg-[#031B2F] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#03335A]"
      >
        <ArrowRight className="size-4" /> العودة للرئيسية
      </a>
    </header>
  );
}

function Toast({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 shadow-sm">
      <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
      {text}
    </div>
  );
}

function AddUserForm({ onAdd }: { onAdd: (email: string, password: string) => Promise<boolean> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await onAdd(email.trim().toLowerCase(), password.trim());
    if (ok) {
      setEmail("");
      setPassword("");
    }
  };

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pe-4 ps-10 text-sm outline-none transition focus:border-[#D49837] focus:bg-white";

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[#03335A]">
        <UserPlus className="size-5 text-[#D49837]" /> إضافة حساب مخصص جديد
      </h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative">
          <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-slate-400">
            <Mail className="size-4" />
          </span>
          <input
            type="email"
            placeholder="البريد الإلكتروني (user@gmail.com)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            dir="ltr"
            required
          />
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-slate-400">
            <KeyRound className="size-4" />
          </span>
          <input
            type="text"
            placeholder="كلمة المرور الخاصة به"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            dir="ltr"
            required
          />
        </div>
        <button
          type="submit"
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F3C873] to-[#D49837] text-sm font-extrabold text-[#031B2F] shadow-md transition hover:brightness-105"
        >
          حفظ وإضافة الحساب
        </button>
      </form>
    </section>
  );
}

function UserRow({
  user,
  onBlock,
  onDelete,
}: {
  user: UserRecord;
  onBlock: (email: string) => void;
  onDelete: (email: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <tr className="transition hover:bg-slate-50/50">
      <td className="p-4 px-6 font-semibold text-slate-700" dir="ltr">
        {user.email}
      </td>
      <td className="p-4 px-6" dir="ltr">
        <div className="flex items-center gap-2">
          <code className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-600">
            {revealed ? user.password : "••••••••"}
          </code>
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="text-slate-400 transition hover:text-slate-600"
            aria-label={revealed ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </td>
      <td className="p-4 px-6">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onBlock(user.email)}
            className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
          >
            <Ban className="size-3.5" /> حظر نهائي
          </button>
          <button
            onClick={() => onDelete(user.email)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
          >
            <Trash2 className="size-3.5" /> حذف
          </button>
        </div>
      </td>
    </tr>
  );
}

function UsersTable({
  users,
  loading,
  onBlock,
  onDelete,
}: {
  users: UserRecord[];
  loading: boolean;
  onBlock: (email: string) => void;
  onDelete: (email: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <h3 className="flex items-center gap-2 text-lg font-extrabold text-[#03335A]">
          <Users className="size-5 text-[#D49837]" /> المستخدمون المصرح لهم بالدخول ({users.length})
        </h3>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-400">جاري تحميل البيانات...</div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">لا يوجد أي مستخدمين مسجلين حالياً.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-right">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="p-4 px-6">البريد الإلكتروني</th>
                <th className="p-4 px-6">كلمة المرور المسجلة</th>
                <th className="p-4 px-6 text-left">الإجراءات الأمنية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {users.map((u) => (
                <UserRow key={u.email} user={u} onBlock={onBlock} onDelete={onDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function BlockedList({ blocked, onUnblock }: { blocked: string[]; onUnblock: (email: string) => void }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[#03335A]">
        <Ban className="size-5 text-red-500" /> قائمة المحظورين نهائياً ({blocked.length})
      </h3>
      {blocked.length === 0 ? (
        <p className="text-sm text-slate-400">لا يوجد أي إيميل محظور حالياً، النظام آمن ونظيف.</p>
      ) : (
        <div className="space-y-2">
          {blocked.map((email) => (
            <div
              key={email}
              className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 p-3.5"
            >
              <span className="text-sm font-semibold text-red-900" dir="ltr">
                {email}
              </span>
              <button
                onClick={() => onUnblock(email)}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50"
              >
                رفع الحظر والسماح بالدخول
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   الصفحة الرئيسية
────────────────────────────────────────────────────────────── */

export default function AdminPanelPage() {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const flash = useCallback((text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  }, []);

  const fetchDatabase = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users || []);
      setBlocked(data.blocked || []);
    } catch {
      flash("تعذر تحميل البيانات من السيرفر.");
    }
    setLoading(false);
  }, [flash]);

  useEffect(() => {
    if (isAdminUnlocked) fetchDatabase();
  }, [isAdminUnlocked, fetchDatabase]);

  const saveDatabase = async (nextUsers: UserRecord[], nextBlocked: string[]): Promise<boolean> => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: nextUsers, blocked: nextBlocked }),
      });
      if (!res.ok) throw new Error();
      setUsers(nextUsers);
      setBlocked(nextBlocked);
      return true;
    } catch {
      flash("حدث خطأ أثناء حفظ التعديلات.");
      return false;
    }
  };

  const handleAddUser = async (email: string, password: string) => {
    if (!email || !password) return false;
    if (users.some((u) => u.email.toLowerCase() === email)) {
      flash("هذا البريد الإلكتروني موجود مسبقاً!");
      return false;
    }
    const ok = await saveDatabase(
      [...users, { email, password, status: "active" }],
      blocked.filter((b) => b !== email)
    );
    if (ok) flash("تمت إضافة المستخدم بنجاح ✅");
    return ok;
  };

  const handleBlockUser = async (email: string) => {
    const ok = await saveDatabase(
      users.filter((u) => u.email !== email),
      Array.from(new Set([...blocked, email]))
    );
    if (ok) flash(`تم حظر ${email} نهائياً 🚫`);
  };

  const handleDeleteUser = async (email: string) => {
    const ok = await saveDatabase(users.filter((u) => u.email !== email), blocked);
    if (ok) flash(`تم حذف ${email} من القائمة 🗑️`);
  };

  const handleUnblock = async (email: string) => {
    const ok = await saveDatabase(users, blocked.filter((b) => b !== email));
    if (ok) flash(`تم رفع الحظر عن ${email}`);
  };

  if (!isAdminUnlocked) {
    return <LockScreen onUnlock={() => setIsAdminUnlocked(true)} />;
  }

  return (
    <FullBleed className="bg-[#F2F5F8] p-6 font-sans text-slate-800 lg:p-10">
      <div dir="rtl" className="mx-auto max-w-5xl space-y-8">
        <PanelHeader />
        {message && <Toast text={message} />}
        <AddUserForm onAdd={handleAddUser} />
        <UsersTable users={users} loading={loading} onBlock={handleBlockUser} onDelete={handleDeleteUser} />
        <BlockedList blocked={blocked} onUnblock={handleUnblock} />
      </div>
    </FullBleed>
  );
}