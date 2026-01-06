import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "./components/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RedGateSalesTrack 2026 by Memento",
  description: "Advanced Sales Tracking Application",
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { auth } from "../auth";

import { ThemeProvider } from "./contexts/ThemeContext";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <ClientLayout session={session}>
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
