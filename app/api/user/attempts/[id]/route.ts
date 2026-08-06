import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import TestAttempt from "@/lib/models/TestAttempt";
import { getUserIdFromCookie } from "@/lib/auth/getUser";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;
  const attempt = await TestAttempt.findOne({ _id: id, user: userId });

  if (!attempt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ attempt });
}