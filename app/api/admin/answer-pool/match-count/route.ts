import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AnswerPool from "@/lib/models/AnswerPool";

export async function POST(req: Request) {
  await connectDB();
  const { requiredTags, excludedTags, correctAnswer } = await req.json();

  const filter: Record<string, unknown> = {};

  if (requiredTags?.length > 0) {
    filter.tags = { $all: requiredTags };
  }
  if (excludedTags?.length > 0) {
    filter.tags = { ...(filter.tags as object || {}), $nin: excludedTags };
  }
  if (correctAnswer) {
    filter.value = { $ne: correctAnswer };
  }

  const count = await AnswerPool.countDocuments(filter);
  return NextResponse.json({ count });
}