import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Insights",
  description: "Tracking AI companies strategies through their hiring data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
