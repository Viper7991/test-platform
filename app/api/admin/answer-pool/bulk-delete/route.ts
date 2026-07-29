import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AnswerPool from "@/lib/models/AnswerPool";

export async function POST(req: Request) {
  await connectDB();
  const { ids } = await req.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No ids provided" }, { status: 400 });
  }

  const result = await AnswerPool.deleteMany({ _id: { $in: ids } });
  return NextResponse.json({ deletedCount: result.deletedCount });
}