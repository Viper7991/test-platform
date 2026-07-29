import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Question from "@/lib/models/Question";
import TopicCategory from "@/lib/models/TopicCategory";

const SUBJECT = "current-affairs";

export async function POST(req: Request) {
  await connectDB();
  const { rows } = await req.json();
  // rows: [{ questionText, topicCategory (label), requiredTags: string[], excludedTags: string[], correctAnswer, explanation }]

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  let added = 0;
  const errors: string[] = [];
  const categoryCache: Record<string, string> = {};

  for (const row of rows) {
    const questionText = (row.questionText || "").trim();
    const categoryLabel = (row.topicCategory || "").trim();
    const requiredTags = (row.requiredTags || []).map((t: string) => t.trim().toLowerCase()).filter(Boolean);
    const excludedTags = (row.excludedTags || []).map((t: string) => t.trim().toLowerCase()).filter(Boolean);
    const correctAnswer = (row.correctAnswer || "").trim();
    const explanation = (row.explanation || "").trim();

    if (!questionText || !categoryLabel || !correctAnswer || requiredTags.length === 0) {
      errors.push(`Skipped a row — missing required field: "${questionText.slice(0, 50)}"`);
      continue;
    }

    // Find or auto-create the topic category
    let categoryId = categoryCache[categoryLabel.toLowerCase()];
    if (!categoryId) {
      const slug = categoryLabel.toLowerCase().replace(/\s+/g, "-");
      let category = await TopicCategory.findOne({ subject: SUBJECT, name: slug });
      if (!category) {
        category = await TopicCategory.create({ subject: SUBJECT, name: slug, label: categoryLabel });
      }
      categoryId = category._id.toString();
      categoryCache[categoryLabel.toLowerCase()] = categoryId;
    }

    // Avoid exact duplicate questions on repeated imports
    const existing = await Question.findOne({ questionText });
    if (existing) {
      errors.push(`Skipped duplicate: "${questionText.slice(0, 50)}..."`);
      continue;
    }

    await Question.create({
      questionText,
      topicCategory: categoryId,
      requiredTags,
      excludedTags,
      correctAnswer,
      explanation,
    });
    added++;
  }

  return NextResponse.json({ added, errors });
}