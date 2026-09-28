import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { RoleProvider } from "@/components/RoleContext";

export const metadata: Metadata = {
  title: "Faculty Management ERP | คณะศิลปศาสตร์และวิทยาศาสตร์",
  description: "ระบบบริหารงานสารบรรณ ธุรการ การเงิน พัสดุ โครงการ และแผนยุทธศาสตร์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex antialiased">
        <RoleProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </RoleProvider>
      </body>
    </html>
  );
}
