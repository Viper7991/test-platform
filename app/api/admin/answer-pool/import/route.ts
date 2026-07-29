import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AnswerPool from "@/lib/models/AnswerPool";

export async function POST(req: Request) {
  await connectDB();
  const { rows } = await req.json(); // rows: [{ value: string, tags: string[] }]

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  let added = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const value = (row.value || "").trim();
    const tags = (row.tags || []).map((t: string) => t.trim().toLowerCase()).filter(Boolean);

    if (!value) { errors.push("Row with empty value skipped"); continue; }
    if (tags.length === 0) { errors.push(`"${value}" skipped — no tags given`); continue; }

    const existing = await AnswerPool.findOne({ value: new RegExp(`^${value}$`, "i") });

    if (existing) {
      const mergedTags = [...new Set([...existing.tags, ...tags])];
      existing.tags = mergedTags;
      await existing.save();
      updated++;
    } else {
      await AnswerPool.create({ value, tags });
      added++;
    }
  }

  return NextResponse.json({ added, updated, errors });
}