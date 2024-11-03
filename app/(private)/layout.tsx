"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/hooks";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

// Import components from @components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

// Import global styles
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading || !mounted) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`dark:bg-black ${inter.className}`}>
          <div className="flex min-h-screen items-center justify-center">
            Loading...
          </div>
        </body>
      </html>
    );
  }

  // If not authenticated, show redirect message
  if (!user) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`dark:bg-black ${inter.className}`}>
          <div className="flex min-h-screen items-center justify-center">
            Redirecting to login...
          </div>
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
        >
          {mounted && (
            <>
              <Header />
              <main className="min-h-screen bg-background">
                {children}
              </main>
              <Footer />
              <ScrollToTop />
            </>
          )}
        </ThemeProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
