import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Questions | Admin | Current Affairs",
  description: "Manage and review questions.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}