import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function getUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}