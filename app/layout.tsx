import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "./components/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SalesTrack 2026 by Memento",
  description: "Advanced Sales Tracking Application",
  icons: {
    icon: '/logo.png',
  },
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
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <ClientLayout session={session}>
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
