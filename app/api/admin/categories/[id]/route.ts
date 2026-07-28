import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import TopicCategory from "@/lib/models/TopicCategory";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  await TopicCategory.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}