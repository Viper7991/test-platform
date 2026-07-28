import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Question from "@/lib/models/Question";

export async function GET() {
  await connectDB();
  const questions = await Question.find()
    .populate("topicCategory")
    .sort({ createdAt: -1 });
  return NextResponse.json({ questions });
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  const {
    questionText,
    topicCategory,
    requiredTags,
    excludedTags,
    correctAnswer,
    explanation,
  } = body;

  if (!questionText || !topicCategory || !correctAnswer) {
    return NextResponse.json(
      { error: "Question text, category, and correct answer are required" },
      { status: 400 }
    );
  }
  if (!requiredTags || requiredTags.length === 0) {
    return NextResponse.json(
      { error: "At least one required tag is needed" },
      { status: 400 }
    );
  }

  const question = await Question.create({
    questionText,
    topicCategory,
    requiredTags,
    excludedTags: excludedTags || [],
    correctAnswer,
    explanation: explanation || "",
  });

  return NextResponse.json({ question });
}