import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AnswerPool from "@/lib/models/AnswerPool";
import { toCSV } from "@/lib/csv";

export async function GET() {
  await connectDB();
  const entries = await AnswerPool.find().sort({ value: 1 });

  const rows = [
    ["value", "tags"],
    ...entries.map((e) => [e.value, e.tags.join(";")]),
  ];

  const csv = toCSV(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="answer-pool-backup-${Date.now()}.csv"`,
    },
  });
}