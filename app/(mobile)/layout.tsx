"use client";

import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "@/app/globals.css";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return minimal layout during SSR
  if (!mounted) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={`${inter.className} dark:bg-black`}>
        <ThemeProvider
          enableSystem={false}
          attribute="class"
          defaultTheme="light"
        >
          <div className="min-h-screen bg-background">
            {children}
          </div>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
} 