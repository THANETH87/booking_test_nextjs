import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TRPCProvider } from "@/lib/trpc-provider";
import { ToastProvider } from "@/app/components/Toast";
import { Navbar } from "@/app/components/Navbar";
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
  title: "SalonQ — Book Your Appointment",
  description:
    "Professional queue booking system for hair salon appointments. Book your slot online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TRPCProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex flex-1 flex-col">{children}</main>
          </ToastProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
