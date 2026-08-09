import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marked Questions | Current Affairs",
  description: "View and manage your marked questions.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}