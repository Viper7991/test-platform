import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Current Affairs",
  description: "Choose how you'd like to practice.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}