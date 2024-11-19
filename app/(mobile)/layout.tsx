"use client";

import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "@/app/globals.css";
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import { useEffect, useState } from 'react';

const inter = Inter({ subsets: ["latin"] });

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add mounting check
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem 
      disableTransitionOnChange
      // Force client-side rendering for theme
      suppressHydrationWarning
    >
      <div className={inter.className}>
        <ProtectedRoute>
          <main className="flex-grow bg-background dark:bg-gray-950">{children}</main>
          <Toaster position="top-center" />
        </ProtectedRoute>
      </div>
    </ThemeProvider>
  );
} 