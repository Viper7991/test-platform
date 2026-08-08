import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Question from "@/lib/models/Question";
import { toCSV } from "@/lib/csv";

export async function GET() {
  await connectDB();
  const questions = await Question.find().populate("topicCategory", "label").sort({ createdAt: 1 });

  const rows = [
    ["questionText", "topicCategory", "requiredTags", "excludedTags", "correctAnswer", "explanation"],
    ...questions.map((q) => [
      q.questionText,
      (q.topicCategory as any)?.label || "",
      q.requiredTags.join(";"),
      (q.excludedTags || []).join(";"),
      q.correctAnswer,
      q.explanation || "",
    ]),
  ];

  const csv = toCSV(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="questions-backup-${Date.now()}.csv"`,
    },
  });
}