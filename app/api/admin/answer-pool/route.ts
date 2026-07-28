import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AnswerPool from "@/lib/models/AnswerPool";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");

  const filter = tag ? { tags: tag } : {};
  const entries = await AnswerPool.find(filter).sort({ value: 1 });
  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  await connectDB();
  const { values, tags } = await req.json();

  if (!Array.isArray(values) || values.length === 0) {
    return NextResponse.json({ error: "No values provided" }, { status: 400 });
  }
  if (!Array.isArray(tags) || tags.length === 0) {
    return NextResponse.json({ error: "At least one tag is required" }, { status: 400 });
  }

  // Clean + dedupe the incoming values
  const cleanValues = [...new Set(
    values.map((v: string) => v.trim()).filter((v: string) => v.length > 0)
  )];

  // Check which already exist (case-insensitive) so we don't create duplicates
  const existing = await AnswerPool.find({
    value: { $in: cleanValues.map((v) => new RegExp(`^${v}$`, "i")) },
  });
  const existingValuesLower = new Set(existing.map((e) => e.value.toLowerCase()));

  const toInsert = cleanValues.filter(
    (v) => !existingValuesLower.has(v.toLowerCase())
  );

  const inserted = await AnswerPool.insertMany(
    toInsert.map((value) => ({ value, tags }))
  );

  return NextResponse.json({
    inserted,
    skipped: cleanValues.length - toInsert.length,
  });
}