import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Digital Identity System",
  description: "A premium GraphRAG-powered AI career identity dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#080b11] text-slate-100 min-h-full flex antialiased`}>
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Main Workspace Area */}
        <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-gradient-to-b from-[#0a0f1d] via-[#080b11] to-[#080b11]">
          {children}
        </main>
      </body>
    </html>
  );
}
