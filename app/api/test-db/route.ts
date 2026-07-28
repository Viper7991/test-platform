import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/lib/models/Subject";

export async function GET() {
  await connectDB();

  // Create a Current Affairs subject if it doesn't already exist
  const existing = await Subject.findOne({ name: "current-affairs" });
  if (!existing) {
    await Subject.create({
      name: "current-affairs",
      label: "Current Affairs",
    });
  }

  const subjects = await Subject.find();
  return NextResponse.json({ status: "connected", subjects });
}