import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/lib/models/Subject";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "current-affairs";

  const subject = await Subject.findOne({ name });
  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }
  return NextResponse.json({ subject });
}