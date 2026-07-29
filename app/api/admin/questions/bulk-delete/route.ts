import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Question from "@/lib/models/Question";

export async function POST(req: Request) {
  await connectDB();
  const { ids } = await req.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No ids provided" }, { status: 400 });
  }

  const result = await Question.deleteMany({ _id: { $in: ids } });
  return NextResponse.json({ deletedCount: result.deletedCount });
}