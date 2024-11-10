import { Metadata } from "next";

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
      <head />
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
} 