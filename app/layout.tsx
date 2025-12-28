import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "highlight.js/styles/github-dark.css";
import { profile } from "@/constants/profile";
import { StructuredData } from "@/components/layout/StructuredData";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { BusinessCardProvider } from "@/components/layout/BusinessCardContext";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: {
    default: `${profile.name} - ${profile.title}`,
    template: `%s | ${profile.name}`,
  },
  description: profile.description,
  keywords: profile.keywords,
  authors: [{ name: profile.name }],
  creator: profile.name,
  publisher: profile.name,

  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: profile.siteUrl,
    title: `${profile.name} - ${profile.title}`,
    description: profile.description,
    siteName: profile.name,
    images: [
      {
        url: `${profile.siteUrl}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${profile.name} - ${profile.title}`,
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} - ${profile.title}`,
    description: profile.description,
    images: [`${profile.siteUrl}/images/og-image.jpg`],
    creator: "@jizzel", // Update with actual Twitter handle
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Verification (add when available)
  // verification: {
  //   google: "your-google-verification-code",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const shouldUseDark = theme === 'dark' || (!theme && prefersDark);
                if (!shouldUseDark) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <BusinessCardProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
            <Analytics />
          </BusinessCardProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
