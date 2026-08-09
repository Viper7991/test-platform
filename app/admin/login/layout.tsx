import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Admin | Current Affairs",
  description: "Access your admin panel.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>;
}