import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'A Plus Assists',
  description: 'Get expert help with your essays and assignments',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
        <SpeedInsights />
        <Toaster />
      </body>
    </html>
  );
} 