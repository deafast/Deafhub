import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://www.deafhub.cc";
const siteName = "DEAF|HUB Esports";
const siteDescription = "DeafHub — a community esports project for Deaf and hard of hearing players.";

const socialImagePath = "/branding/deafhub-dh-icon-512.png";
const socialImage = process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
  ? new URL(socialImagePath, `https://${process.env.VERCEL_URL}`).href
  : socialImagePath;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: siteName,
    siteName,
    description: siteDescription,
    images: [
      {
        url: socialImage,
        width: 512,
        height: 512,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [socialImage],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/branding/deafhub-browser.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/branding/deafhub-browser-16.png", sizes: "16x16", type: "image/png" },
      { url: "/branding/deafhub-browser-32.png", sizes: "32x32", type: "image/png" },
      { url: "/branding/deafhub-browser-48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/branding/deafhub-browser.ico",
    apple: { url: "/branding/deafhub-browser-180.png", sizes: "180x180", type: "image/png" },
  },
};

import Providers from "@/components/shared/Providers";
import Header from "@/components/shell/Header";
import BottomNav from "@/components/shell/BottomNav";
import Preloader from "@/components/shared/PreloaderV8";
import SmoothScroll from "@/components/shared/SmoothScroll";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no" className="dark notranslate scroll-pb-24 md:scroll-pb-0" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <Providers>
          <Preloader />
          <Header />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}

