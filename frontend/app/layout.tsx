import type { Metadata } from "next";
import Script from "next/script";
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
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "AI Insights | AI Company Hiring Signals",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Insights | AI Company Hiring Signals",
    description:
      "Track AI company strategy through public hiring data and evidence-backed signals.",
    images: ["/og.png"],
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
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-PB14HNPZPF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PB14HNPZPF');
          `}
        </Script>
        <Header />
        {children}
      </body>
    </html>
  );
}
