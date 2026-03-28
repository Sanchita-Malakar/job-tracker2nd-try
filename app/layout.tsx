import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-syne",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Track your job applications",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="bg-gradient-to-br from-[#0a0c10] via-[#0d0f14] to-[#13161e] text-[#e8eaf2] overflow-hidden h-screen flex">
        <Sidebar />
        {/* Fixed: Use CSS class instead of hardcoded margin */}
        <div className="sidebar-offset flex flex-col flex-1 h-screen overflow-hidden relative">
          {children}
        </div>
      </body>
    </html>
  );
}
