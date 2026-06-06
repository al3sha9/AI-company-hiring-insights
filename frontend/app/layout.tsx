import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-insights.100xbetter.ai"),
  title: {
    default: "AI Insights | AI Company Hiring Signals",
    template: "%s | AI Insights",
  },
  description:
    "Track where leading AI companies are heading by analyzing public hiring data, category momentum, role evidence, and strategic signals.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AI Insights | AI Company Hiring Signals",
    description:
      "Strategic hiring intelligence for CEOs and investors tracking AI companies, infrastructure bets, deployment signals, and market direction.",
    url: "/",
    siteName: "AI Insights",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Insights | AI Company Hiring Signals",
    description:
      "Track AI company strategy through public hiring data and evidence-backed signals.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        <Header />
        {children}
      </body>
    </html>
  );
}
