import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Question from "@/lib/models/Question";
import TopicCategory from "@/lib/models/TopicCategory";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject") || "current-affairs";

  // Find category IDs belonging to this subject, then find questions in those categories
  const categories = await TopicCategory.find({ subject }).select("_id");
  const categoryIds = categories.map((c) => c._id);

  const questions = await Question.find({
    topicCategory: { $in: categoryIds },
    active: true,
  }).populate("topicCategory", "label name");

  return NextResponse.json({ questions });
}