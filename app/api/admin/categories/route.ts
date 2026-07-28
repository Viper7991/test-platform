import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import TopicCategory from "@/lib/models/TopicCategory";

const SUBJECT = "current-affairs"; // hardcoded for now, becomes dynamic when we add more subjects

export async function GET() {
  await connectDB();
  const categories = await TopicCategory.find({ subject: SUBJECT }).sort({ label: 1 });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  await connectDB();
  const { label } = await req.json();

  if (!label || !label.trim()) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  const name = label.trim().toLowerCase().replace(/\s+/g, "-"); // slugify

  const existing = await TopicCategory.findOne({ subject: SUBJECT, name });
  if (existing) {
    return NextResponse.json({ error: "This category already exists" }, { status: 400 });
  }

  const category = await TopicCategory.create({ subject: SUBJECT, name, label: label.trim() });
  return NextResponse.json({ category });
}