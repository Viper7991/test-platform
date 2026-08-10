import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Report from "@/lib/models/Report";
import User from "@/lib/models/User";
import { getUserIdFromCookie } from "@/lib/auth/getUser";

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  const { questionId, questionText, options, correctAnswer, selectedAnswer, source, reason } = body;

  if (!questionText || !Array.isArray(options) || !correctAnswer || !source) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let reporterEmail = null;
  const userId = await getUserIdFromCookie();
  if (userId) {
    const user = await User.findById(userId).select("email");
    reporterEmail = user?.email || null;
  }

  const report = await Report.create({
    questionId: questionId || undefined,
    questionText,
    options,
    correctAnswer,
    selectedAnswer: selectedAnswer || null,
    source,
    reason: reason || "",
    reporterEmail,
  });

  return NextResponse.json({ success: true, report });
}