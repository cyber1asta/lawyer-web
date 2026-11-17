import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("lawyer_db");

    let usersData: any = await db.collection("settings").findOne({ type: "app_data" });

    if (!usersData) {
      usersData = {
        users: [{ email: "cyberasta91@gmail.com", password: "123456", status: "active" }],
        blocked: []
      };
      await db.collection("settings").insertOne({ type: "app_data", ...usersData });
    }

    return NextResponse.json({
      users: usersData?.users || [],
      blocked: usersData?.blocked || []
    });
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("lawyer_db");
    const body = await req.json();

    const usersData: any = await db.collection("settings").findOne({ type: "app_data" });

    let users = usersData?.users || [];
    let blocked = usersData?.blocked || [];

    if (body.users && Array.isArray(body.users)) {
      users = body.users;
    }

    if (body.blocked && Array.isArray(body.blocked)) {
      blocked = body.blocked;
    }

    if (body.email && body.password) {
      const cleanEmail = body.email.toLowerCase().trim();
      const existingIndex = users.findIndex(
        (u: any) => u.email.toLowerCase() === cleanEmail
      );

      if (existingIndex >= 0) {
        users[existingIndex].password = body.password;
      } else {
        users.push({
          email: cleanEmail,
          password: body.password,
          status: "active"
        });
      }

      blocked = blocked.filter((e: string) => e.toLowerCase() !== cleanEmail);
    }

    await db.collection("settings").updateOne(
      { type: "app_data" },
      { $set: { users, blocked } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}