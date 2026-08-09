import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marked Test | Current Affairs",
  description: "Practice your marked questions.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}