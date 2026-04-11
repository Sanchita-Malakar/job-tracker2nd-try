// app/layout.tsx

import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import SessionProvider from "@/components/SessionProvider";
import Sidebar from "@/components/Sidebar";
import ProfileModal from "@/components/Profilemodal";
import { DataProvider } from "@/contexts/DataContext";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const session = user
    ? {
        user,
        access_token: "",
        token_type: "bearer" as const,
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "",
      }
    : null;

  const isLoggedIn = !!user;

  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body
        className="bg-gradient-to-br from-[#0a0c10] via-[#0d0f14] to-[#13161e] text-[#e8eaf2] overflow-hidden h-screen flex"
      >
        <SessionProvider session={session}>
          {/*
            DataProvider lives here — inside SessionProvider (so auth is ready)
            but wrapping ALL children, so every route can call useData():
            /resumes ✓  /tasks ✓  /analytics ✓  /settings ✓
          */}
          <DataProvider>
            {isLoggedIn ? (
              <>
                <Sidebar />
                <div className="sidebar-offset flex flex-col flex-1 h-screen overflow-hidden relative">
                  {children}
                </div>
                <ProfileModal />
              </>
            ) : (
              <div className="flex flex-col flex-1 h-screen">
                {children}
              </div>
            )}
          </DataProvider>
        </SessionProvider>
      </body>
    </html>
  );
}