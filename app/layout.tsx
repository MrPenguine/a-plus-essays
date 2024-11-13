import { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A+ Essays | Essay Writing by Professionals",
  description: "Professional Essay Writing Services",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className="relative z-1 font-inter text-regular font-normal text-secondary-gray-500"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
} 