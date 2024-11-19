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
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className={inter.className}>
        <ProtectedRoute>
          {children}
        </ProtectedRoute>
      </div>
    </ThemeProvider>
  );
} 