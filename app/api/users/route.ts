import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "lib", "users-db.json");

// قراءة المستخدمين
export async function GET() {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ users: [], blocked: [] });
    }
    const fileData = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json(JSON.parse(fileData));
  } catch (error) {
    return NextResponse.json({ error: "Failed to read database" }, { status: 500 });
  }
}

// تعديل أو إضافة مستخدمين / حظر
export async function POST(req: Request) {
  try {
    const body = await req.json();
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update database" }, { status: 500 });
  }
}