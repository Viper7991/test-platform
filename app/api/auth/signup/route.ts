import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  await connectDB();
  const { email, password, name } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email: email.toLowerCase().trim(),
    passwordHash,
    name: name?.trim() || "",
  });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: "30d" });

  const response = NextResponse.json({ success: true, user: { email: user.email, name: user.name } });
  response.cookies.set("user_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}