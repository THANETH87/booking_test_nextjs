import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TRPCProvider } from "@/lib/trpc-provider";
import { ToastProvider } from "@/app/components/Toast";
import { Navbar } from "@/app/components/Navbar";
import { AIChatWidget } from "@/app/components/AIChatWidget";
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
  title: "SalonQ — จองคิวร้านทำผม",
  description:
    "ระบบจองคิวร้านทำผมออนไลน์ จองง่าย สะดวก รวดเร็ว",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TRPCProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex flex-1 flex-col">{children}</main>
            <AIChatWidget />
          </ToastProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
