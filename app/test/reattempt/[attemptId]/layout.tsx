import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reattempt Test | Current Affairs",
  description: "Reattempt a previously taken test.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}