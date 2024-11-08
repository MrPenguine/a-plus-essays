"use client";

import React from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "@/app/globals.css";
import ProtectedRoute from '@/components/Auth/ProtectedRoute';

// Import components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

const inter = Inter({ subsets: ["latin"] });

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ProtectedRoute>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
            <ScrollToTop />
            <Toaster position="top-center" />
          </ProtectedRoute>
        </ThemeProvider>
      </body>
    </html>
  );
}
