import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import TopicCategory from "@/lib/models/TopicCategory";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject") || "current-affairs";

  const categories = await TopicCategory.find({ subject }).sort({ label: 1 });
  return NextResponse.json({ categories });
}