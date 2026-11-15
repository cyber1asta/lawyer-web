import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "lib", "users-db.json");

// ذاكرة مؤقتة لضمان عدم ضياع التحديثات في بيئة السيرفرلس (Serverless)
let memoryCache: { users: any[]; blocked: string[] } | null = null;

function readDB() {
  try {
    if (memoryCache) return memoryCache;
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      memoryCache = JSON.parse(fileData);
      return memoryCache;
    }
  } catch (e) {
    console.error("Error reading db file", e);
  }
  return { users: [], blocked: [] };
}

export async function GET() {
  try {
    const data = readDB();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ users: [], blocked: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    memoryCache = body; // تحديث الذاكرة المؤقتة فوراً

    // محاولة الكتابة في الملف (إذا سمح النظام بذلك محلياً)
    try {
      if (fs.existsSync(path.dirname(filePath))) {
        fs.writeFileSync(filePath, JSON.stringify(body, null, 2), "utf-8");
      }
    } catch (writeErr) {
      // نتجاهل خطأ الكتابة في Vercel Read-only ونكتفي بالذاكرة المؤقتة لضمان استمرار عمل التطبيق
      console.warn("FileSystem is read-only, using memory cache:", writeErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update database" }, { status: 500 });
  }
}