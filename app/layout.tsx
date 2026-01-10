import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FarmAura - Farm Aura. Redeem Life.",
    template: "%s | FarmAura",
  },
  description:
    "A social gamification platform where teams and friends give Aura Points to each other and redeem them for rewards.",
  keywords: [
    "gamification",
    "team rewards",
    "aura points",
    "social rewards",
    "team building",
  ],
  authors: [{ name: "Aura Farm Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "FarmAura",
    title: "FarmAura - Farm Aura. Redeem Life.",
    description:
      "A social gamification platform where teams and friends give Aura Points to each other and redeem them for rewards.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FarmAura - Farm Aura. Redeem Life.",
    description:
      "A social gamification platform where teams and friends give Aura Points to each other and redeem them for rewards.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors theme="light" />
      </body>
    </html>
  );
}
