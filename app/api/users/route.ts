import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "users.json");

// التأكد من وجود الملف وقاعدة البيانات المحلية
function ensureFile() {
  const dir = path.dirname(dataFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dataFilePath)) {
    const initialData = {
      users: [
        { email: "cyberasta91@gmail.com", password: "123456", status: "active" }
      ],
      blocked: []
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
  }
}

export async function GET() {
  try {
    ensureFile();
    const fileData = fs.readFileSync(dataFilePath, "utf-8");
    const db = JSON.parse(fileData);
    return NextResponse.json(db);
  } catch (error: any) {
    return NextResponse.json({ users: [], blocked: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    ensureFile();
    const body = await req.json();
    const fileData = fs.readFileSync(dataFilePath, "utf-8");
    let db = JSON.parse(fileData);

    if (body.users && Array.isArray(body.users)) {
      db.users = body.users;
    }

    if (body.blocked && Array.isArray(body.blocked)) {
      db.blocked = body.blocked;
    }

    if (body.email && body.password) {
      const existingIndex = db.users.findIndex(
        (u: any) => u.email.toLowerCase() === body.email.toLowerCase()
      );
      if (existingIndex >= 0) {
        db.users[existingIndex].password = body.password;
      } else {
        db.users.push({
          email: body.email.toLowerCase(),
          password: body.password,
          status: "active"
        });
      }
      // إزالة الإيميل من قائمة المحظورين إذا تمت إضافته كنشط
      db.blocked = db.blocked.filter(
        (e: string) => e.toLowerCase() !== body.email.toLowerCase()
      );
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(db, null, 2));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}