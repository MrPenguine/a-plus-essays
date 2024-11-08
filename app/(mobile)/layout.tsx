"use client";

import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "@/app/globals.css";
import ProtectedRoute from '@/components/Auth/ProtectedRoute';

const inter = Inter({ subsets: ["latin"] });

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ProtectedRoute>
            <main className="flex-grow">{children}</main>
            <Toaster position="top-center" />
          </ProtectedRoute>
        </ThemeProvider>
      </body>
    </html>
  );
} 