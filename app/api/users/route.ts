import { NextResponse } from "next/server";
import mongoose from "mongoose";

// رابط الاتصال مباشرة في الكود
const MONGODB_URI = "mongodb+srv://takimohamed531_db_user:T%28p%26K-4u6EtPk5Y@cluster0.zlziugt.mongodb.net/";

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}

// نموذج بيانات المستخدمين
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  active: { type: Boolean, default: true }
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// قراءة المستخدمين (GET)
export async function GET() {
  try {
    await connectDB();
    const users = await User.find({});
    return NextResponse.json({ users, blocked: [] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read database", details: error.message }, { status: 500 });
  }
}

// حفظ أو تحديث المستخدمين (POST)
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    
    if (Array.isArray(body)) {
      await User.deleteMany({});
      await User.insertMany(body);
    } else if (body.email) {
      await User.findOneAndUpdate(
        { email: body.email },
        body,
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update database", details: error.message }, { status: 500 });
  }
}