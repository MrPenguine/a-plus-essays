import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - A+ Essays",
  description: "Your A+ Essays Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 