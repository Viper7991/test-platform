import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Report from "@/lib/models/Report";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const { status } = await req.json();

  const report = await Report.findByIdAndUpdate(id, { status }, { new: true });
  return NextResponse.json({ report });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  await Report.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}