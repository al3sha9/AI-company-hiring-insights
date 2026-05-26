import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Hiring Signals",
  description:
    "Strategy intelligence from the roles AI companies are actively hiring for.",
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
