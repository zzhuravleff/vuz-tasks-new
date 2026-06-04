// app/layout.tsx

import { Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/ui/BottomNav";
import { ServiceWorkerRegistrar } from "@/components/ui/ServiceWorkerRegistrar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Практика",
  description: "Трекер задач для студентов",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ВУЗадачи",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[#f5f5f5] antialiased">
        <main className="w-full p-4">{children}</main>
        <BottomNav />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}