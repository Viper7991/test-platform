import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Topic Specific Test | Current Affairs",
  description: "Practice questions on a specific topic.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}