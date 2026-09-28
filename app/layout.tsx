"use client";

import React from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { RoleProvider, useRole } from "@/components/RoleContext";
import { usePathname } from "next/navigation";

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isLoading } = useRole();

  // If on login page, render full screen without sidebar/navbar
  if (pathname === "/login") {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  // If loading or unauthenticated, show clean loading placeholder
  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
        <div className="space-y-2 text-center">
          <div className="w-8 h-8 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>กำลังตรวจสอบการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen antialiased bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <title>Faculty ERP | คณะศิลปศาสตร์และวิทยาศาสตร์</title>
        <meta name="description" content="ระบบบริหารงานคณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ" />
      </head>
      <body>
        <RoleProvider>
          <AppShell>{children}</AppShell>
        </RoleProvider>
      </body>
    </html>
  );
}
