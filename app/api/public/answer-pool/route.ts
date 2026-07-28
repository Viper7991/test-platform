import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AnswerPool from "@/lib/models/AnswerPool";

export async function GET() {
  await connectDB();
  const entries = await AnswerPool.find().select("value tags");
  return NextResponse.json({ entries });
}