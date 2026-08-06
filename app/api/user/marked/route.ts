import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import MarkedQuestion from "@/lib/models/MarkedQuestion";
import { getUserIdFromCookie } from "@/lib/auth/getUser";

export async function GET() {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await connectDB();
  const doc = await MarkedQuestion.findOne({ user: userId });
  return NextResponse.json({ questionIds: doc?.questionIds || [] });
}

export async function PUT(req: Request) {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await connectDB();
  const { questionIds } = await req.json();

  const doc = await MarkedQuestion.findOneAndUpdate(
    { user: userId },
    { user: userId, questionIds },
    { upsert: true, new: true }
  );
  return NextResponse.json({ questionIds: doc.questionIds });
}