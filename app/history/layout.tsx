import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test History | Current Affairs",
  description: "View your test history and performance analytics.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}