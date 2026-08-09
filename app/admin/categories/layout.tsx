import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Topic Categories | Admin | Current Affairs",
  description: "Manage and review categories.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}