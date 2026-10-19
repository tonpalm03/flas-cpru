"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sliders } from "lucide-react";

export default function NavigationSettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Graceful automatic redirect to workflow and role settings
    const timer = setTimeout(() => {
      router.replace("/settings/workflows");
    }, 100);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center max-w-md w-full space-y-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto border border-blue-100">
          <Sliders className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">กำลังนำทางไปยังการตั้งค่าระบบ</h2>
          <p className="text-xs text-slate-500 mt-1">
            โครงสร้างเมนูและสิทธิ์ถูกรวมเข้ากับการตั้งค่าขั้นตอนงานและบัญชีผู้ใช้เรียบร้อยแล้ว
          </p>
        </div>
        <Link
          href="/settings/workflows"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ไปยังหน้าขั้นตอนงาน & กำหนดสิทธิ์</span>
        </Link>
      </div>
    </div>
  );
}
