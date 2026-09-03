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

export const metadata: Metadata = {
  title: "शिवसेना शहर चांदवड | मतदार शोध प्रणाली (Shivsena Shahar Chandwad)",
  description: "शिवसेना शहर चांदवड - मतदार शोध प्रणाली, विधानसभा मतदारसंघ ११८ - चांदवड, लोकसभा २० - दिंडोरी.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-slate-100 font-sans antialiased text-slate-900">
        {children}
      </body>
    </html>
  );
}
