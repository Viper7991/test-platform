import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results | Current Affairs",
  description: "View your test results and performance analytics.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}