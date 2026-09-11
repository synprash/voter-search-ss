import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { PwaController } from "@/components/pwa-controller";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "शिवसेना शहर चांदवड | मतदार शोध प्रणाली (Shivsena Shahar Chandwad)",
  description: "शिवसेना शहर चांदवड - मतदार शोध प्रणाली, विधानसभा मतदारसंघ ११८ - चांदवड, लोकसभा २० - दिंडोरी.",
  manifest: "/manifest.webmanifest",
  applicationName: "शिवसेना मतदार शोध",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "शिवसेना मतदार शोध",
  },
  icons: {
    icon: [
      { url: "/icons/icon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-slate-100 font-sans antialiased text-slate-900">
        <PwaController />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
