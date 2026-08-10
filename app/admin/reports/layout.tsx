import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reported Questions | Current Affairs",
  description: "Manage and review reported questions.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}