"use client";

import React, { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "@/app/globals.css";

// Import components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

const inter = Inter({ subsets: ["latin"] });

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <div className="min-h-screen" />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`dark:bg-black ${inter.className}`} suppressHydrationWarning>
        <ThemeProvider
          enableSystem={false}
          attribute="class"
          defaultTheme="light"
          storageKey="theme"
        >
          <Header />
          {children}
          <Footer />
          <ScrollToTop />
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
