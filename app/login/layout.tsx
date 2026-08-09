import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Current Affairs",
  description: "Sign in to your account.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}