import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Report from "@/lib/models/Report";

export async function GET() {
  await connectDB();
  const reports = await Report.find().sort({ createdAt: -1 });
  return NextResponse.json({ reports });
}