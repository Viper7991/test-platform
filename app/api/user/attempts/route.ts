import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import TestAttempt from "@/lib/models/TestAttempt";
import { getUserIdFromCookie } from "@/lib/auth/getUser";

export async function GET(req: Request) {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");

  const filter: Record<string, unknown> = { user: userId };
  if (mode) filter.mode = mode;

  const attempts = await TestAttempt.find(filter).sort({ submittedAt: -1 });
  return NextResponse.json({ attempts });
}

export async function POST(req: Request) {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await connectDB();
  const body = await req.json();

  try {
    // Upsert on (user, testId) so retried syncs never create duplicates
    const attempt = await TestAttempt.findOneAndUpdate(
      { user: userId, testId: body.testId },
      { ...body, user: userId },
      { upsert: true, new: true }
    );
    return NextResponse.json({ attempt });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 });
  }
}