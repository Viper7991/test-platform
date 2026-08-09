import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Answer Pool | Admin | Current Affairs",
  description: "Manage and review answers.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}