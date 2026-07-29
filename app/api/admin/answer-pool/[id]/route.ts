import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AnswerPool from "@/lib/models/AnswerPool";
import Question from "@/lib/models/Question";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  const entry = await AnswerPool.findById(id);
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Warn if this value is used as a correct answer somewhere
  const usedInQuestions = await Question.countDocuments({ correctAnswer: entry.value });

  await AnswerPool.findByIdAndDelete(id);
  return NextResponse.json({ success: true, wasUsedInQuestions: usedInQuestions });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const { value, tags } = await req.json();

  const update: Record<string, unknown> = {};
  if (value !== undefined) update.value = value.trim();
  if (tags !== undefined) update.tags = tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean);

  const entry = await AnswerPool.findByIdAndUpdate(id, update, { new: true });
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ entry });
}