import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mixed Questions Test | Current Affairs",
  description: "Practice a mixed set of questions from various categories.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}