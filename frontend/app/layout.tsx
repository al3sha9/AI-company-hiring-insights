import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Hiring Signals",
  description:
    "Track where AI companies are hiring, what roles are growing, and what strategy it signals.",
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
