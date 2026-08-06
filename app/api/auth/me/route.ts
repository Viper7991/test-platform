import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { getUserIdFromCookie } from "@/lib/auth/getUser";

export async function GET() {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ user: null });
  }

  await connectDB();
  const user = await User.findById(userId).select("email name");
  return NextResponse.json({ user: user ? { email: user.email, name: user.name } : null });
}