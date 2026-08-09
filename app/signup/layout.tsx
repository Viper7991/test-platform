import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signup | Current Affairs",
  description: "Create a new account.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}