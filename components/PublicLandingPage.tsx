"use client";

import React from "react";
import Link from "next/link";
import { 
  GraduationCap, 
  FileText, 
  FolderKanban, 
  Wallet, 
  Package, 
  Users, 
  LineChart, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react";

export default function PublicLandingPage() {
  const modules = [
    {
      title: "งานธุรการและสารบรรณ",
      desc: "ระบบลงทะเบียนรับ-ส่งหนังสือราชการ สร้างบันทึกข้อความตราครุฑมาตรฐาน ออกเลขหนังสือ และระบบจองห้องประชุม",
      icon: FileText,
      badge: "ระบบงานหลัก"
    },
    {
      title: "งานโครงการและกิจกรรม",
      desc: "ระบบเขียนเสนอโครงการยุทธศาสตร์ 2569 ติดตามการดำเนินงาน และรายงานผลลัพธ์เชื่อมโยงเป้าหมายการพัฒนาที่ยั่งยืน (SDGs)",
      icon: FolderKanban,
      badge: "ยุทธศาสตร์"
    },
    {
      title: "งานการเงินและงบประมาณ",
      desc: "ระบบคุมทะเบียนงบประมาณรายได้ สัญญายืมเงินทดรองจ่ายพร้อมเช็คลิสต์ตรวจเอกสาร และการเบิกจ่ายค่าตอบแทน",
      icon: Wallet,
      badge: "งบประมาณ 2568"
    },
    {
      title: "งานพัสดุและจัดซื้อ",
      desc: "ระบบขอซื้อ-ขอจ้างพัสดุ คำนวณภาษีมูลค่าเพิ่ม (VAT 7%) อัตโนมัติ และติดตามสถานะการจัดซื้อและตรวจรับ",
      icon: Package,
      badge: "จัดซื้อจัดจ้าง"
    },
    {
      title: "งานบริหารงานบุคคล",
      desc: "ระบบยื่นใบลาอิเล็กทรอนิกส์ (e-Leave) พักผ่อน/ป่วย/กิจ สรุปสถิติวันลา และจัดทำแฟ้มสะสมผลงานอาจารย์ (SAR)",
      icon: Users,
      badge: "e-Leave & SAR"
    },
    {
      title: "งานแผนและตัวชี้วัด",
      desc: "ติดตามการขับเคลื่อนยุทธศาสตร์คณะ 4 ด้าน ตัวชี้วัดผลการดำเนินงาน (KPIs) และรายงานความก้าวหน้า",
      icon: LineChart,
      badge: "KPIs คณะ"
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* 1. TOP PUBLIC NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-900 leading-tight">
                คณะศิลปศาสตร์และวิทยาศาสตร์
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                มหาวิทยาลัยราชภัฏชัยภูมิ (CPRU)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/flow"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <span>ผังการทำงาน (Flow)</span>
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <span>เข้าสู่ระบบ ERP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 border-b border-slate-200 py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-900 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-700" />
            <span>ระบบบริหารจัดการองค์กรดิจิทัล คณะศิลปศาสตร์และวิทยาศาสตร์</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-950 tracking-tight leading-tight">
            ศูนย์กลางการบริหารงานคณะ <br className="hidden sm:inline" />
            <span className="text-blue-900">ครบวงจรทั้ง 6 พันธกิจ</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            พัฒนากระบวนการทำงานสู่ระบบดิจิทัล เชื่อมโยงงานสารบรรณ โครงการยุทธศาสตร์ การเงิน พัสดุ บุคลากร และแผนงานอย่างไร้รอยต่อ พร้อมระบบรักษาความปลอดภัยระดับองค์กร
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span>เข้าสู่ระบบสำหรับบุคลากร</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/flow"
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span>ดูผังการทำงานของระบบ (Flow Map)</span>
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ระบบความปลอดภัย Google Cloud Firebase
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
              ออกเอกสารตราครุฑ Word & PDF อัตโนมัติ
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-600" />
              คณะศิลปศาสตร์และวิทยาศาสตร์ มรภ.ชัยภูมิ
            </span>
          </div>
        </div>
      </section>

      {/* 3. 6 CORE MODULES SHOWCASE */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 flex-1">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            โมดูลงานบริการในระบบบริหารจัดการคณะ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            บุคลากร อาจารย์ และผู้บริหารสามารถเข้าใช้งานระบบตามบทบาทหน้าที่
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 hover:border-blue-900/40 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center border border-blue-100">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {mod.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{mod.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{mod.desc}</p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:text-blue-800"
                  >
                    <span>เข้าใช้งานโมดูล</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="font-semibold text-slate-800">
              คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              เลขที่ 999 หมู่ 4 ถนนชัยภูมิ-ตาดโตน ตำบลนาฝาย อำเภอเมือง จังหวัดชัยภูมิ 36000
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/flow" className="hover:text-blue-900">ผังการทำงานระบบ</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-blue-900 font-semibold text-blue-900">เข้าสู่ระบบ ERP</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
