"use client";

import React, { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "@/app/globals.css";
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

const inter = Inter({ subsets: ["latin"] });

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className={inter.className}>
        <ProtectedRoute>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-grow bg-secondary-gray-50 dark:bg-gray-900">{children}</main>
            <Footer />
          </div>
          <ScrollToTop />
          <Toaster position="top-center" />
        </ProtectedRoute>
      </div>
    </ThemeProvider>
  );
}
