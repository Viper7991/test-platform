import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Question from "@/lib/models/Question";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  await Question.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const question = await Question.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json({ question });
}