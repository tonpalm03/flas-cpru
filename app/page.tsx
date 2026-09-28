"use client";

import React from "react";
import Link from "next/link";
import { 
  FileText, 
  FolderKanban, 
  Wallet, 
  Package, 
  Users, 
  LineChart, 
  Plus, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  Calendar,
  Building,
  Sparkles,
  TrendingUp,
  FileCheck
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { MOCK_INBOUND_DOCS, MOCK_PROJECTS, MOCK_LOANS, MOCK_PURCHASE_REQ } from "@/lib/mockData";

export default function FacultyPortalDashboard() {
  const { currentUser } = useRole();

  const quickStats = [
    {
      title: "หนังสือรับ-ส่ง (ธุรการ)",
      count: "18 ฉบับ",
      subtext: "รอดำเนินการ 4 ฉบับ",
      icon: FileText,
      href: "/admin/inbound",
      color: "text-blue-700 bg-blue-50 border-blue-100",
    },
    {
      title: "โครงการยุทธศาสตร์ 2569",
      count: "12 โครงการ",
      subtext: "อนุมัติแล้ว 3 โครงการ",
      icon: FolderKanban,
      href: "/projects",
      color: "text-slate-800 bg-slate-100/80 border-slate-200",
    },
    {
      title: "งบประมาณจัดสรร",
      count: "4.30 ล้านบาท",
      subtext: "เบิกจ่ายแล้ว 42.5%",
      icon: Wallet,
      href: "/finance",
      color: "text-slate-800 bg-slate-100/80 border-slate-200",
    },
    {
      title: "คำขอซื้อ-ขอจ้าง (พัสดุ)",
      count: "5 รายการ",
      subtext: "กำลังดำเนินการจัดซื้อ",
      icon: Package,
      href: "/procurement",
      color: "text-slate-800 bg-slate-100/80 border-slate-200",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900">
              {currentUser?.department || "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์"}
            </span>
            <span className="text-xs text-slate-400">• ปีงบประมาณ 2569</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            สวัสดี, {currentUser?.name || "ผู้ใช้งานระบบ"}
          </h1>
          <p className="text-sm text-slate-600">
            {currentUser?.roleTitle || "บุคลากรคณะ"} — ยินดีต้อนรับสู่ระบบบริหารจัดการคณะแบบครบวงจร
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/memo-generator"
            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างบันทึกข้อความ (Word/PDF)</span>
          </Link>
          <Link
            href="/admin/inbound"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-all"
          >
            <FileCheck className="w-4 h-4 text-blue-700" />
            <span>ลงรับหนังสือใหม่</span>
          </Link>
        </div>
      </div>

      {/* 4 Key Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              href={item.href}
              className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 shadow-card transition-all group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {item.badge ? (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition-colors" />
                )}
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500">{item.title}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{item.count}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.subtext}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 6 Core Modules Direct Portal Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              ระบบงานทั้ง 6 ฝ่ายของคณะ (Faculty Modular Suite)
            </h2>
            <p className="text-xs text-slate-500">
              ระบบเชื่อมโยงฐานข้อมูล Firebase ก้อนเดียวกัน ทำงานร่วมกันอย่างไร้รอยต่อ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Module 1: ธุรการและสารบรรณ */}
          <div className="bg-white border-2 border-blue-600/30 rounded-2xl p-5 shadow-card hover:shadow-float transition-all relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-blue-900 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
              งานรับผิดชอบหลัก
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-blue-800" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">1. ระบบงานธุรการและสารบรรณ</h3>
              <p className="text-xs text-slate-500 mt-1">
                ทะเบียนรับ-ส่งหนังสือ, สร้างบันทึกข้อความราชการ, แทงเรื่องเกษียนหนังสือข้ามฝ่าย, จองห้องประชุม
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Word .docx</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">PDF</span>
                <span className="text-[10px] bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded">e-Saraban</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-blue-800 font-semibold">เข้าสู่ระบบธุรการ</span>
              <Link
                href="/admin"
                className="text-xs text-white bg-blue-900 hover:bg-blue-800 font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                เปิดใช้งาน →
              </Link>
            </div>
          </div>

          {/* Module 2: งานโครงการ */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <FolderKanban className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">2. ระบบงานโครงการและกิจกรรม</h3>
              <p className="text-xs text-slate-500 mt-1">
                เสนอโครงการตามแผน 2569, โครงการศาสตร์พระราชา, แบบตอบรับวิทยากร, รายงานผลโครงการ & SDG
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">แบบฟอร์ม 2569</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Word .docx</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">SDG Goals</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">12 โครงการในระบบ</span>
              <Link
                href="/projects"
                className="text-xs text-slate-700 hover:text-blue-900 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors"
              >
                ดูโครงการ →
              </Link>
            </div>
          </div>

          {/* Module 3: งานการเงิน */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">3. ระบบการเงินและงบประมาณ</h3>
              <p className="text-xs text-slate-500 mt-1">
                ทะเบียนคุมงบรายได้ 2568, สัญญายืมเงินทดรองราชการ, อนุมัติเบิกจ่ายค่าสอน กศ.ปช. และค่านิเทศ
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Excel .xlsx</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">สัญญายืมเงิน</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Checklist ตรวจ</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">งบรายได้ 2568</span>
              <Link
                href="/finance"
                className="text-xs text-slate-700 hover:text-blue-900 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors"
              >
                ตรวจสอบงบ →
              </Link>
            </div>
          </div>

          {/* Module 4: งานพัสดุ */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <Package className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">4. ระบบพัสดุและจัดซื้อจัดจ้าง</h3>
              <p className="text-xs text-slate-500 mt-1">
                ฟอร์มขอซื้อ-ขอจ้างคำนวณ VAT 7% อัตโนมัติ, บันทึกขออนุมัติจัดซื้อจัดจ้าง, ทะเบียนคุมครุภัณฑ์
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Excel .xlsx</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Word .docx</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">ตรวจรับพัสดุ</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">5 ใบขอซื้อในคิว</span>
              <Link
                href="/procurement"
                className="text-xs text-slate-700 hover:text-blue-900 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors"
              >
                ขอซื้อ-ขอจ้าง →
              </Link>
            </div>
          </div>

          {/* Module 5: งานบุคคล */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">5. ระบบบริหารงานบุคคล</h3>
              <p className="text-xs text-slate-500 mt-1">
                ระบบยื่นใบลาพักผ่อน/ลาป่วย/ลากิจ, สัญญาจ้างพนักงานตามภารกิจ, แฟ้มประวัติและผลงานอาจารย์ (SAR)
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">PDF ใบลา</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">ประวัติอาจารย์</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">สัญญาจ้าง</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">วันลาพักผ่อนคงเหลือ 10 วัน</span>
              <Link
                href="/hr"
                className="text-xs text-slate-700 hover:text-blue-900 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors"
              >
                ยื่นใบลา →
              </Link>
            </div>
          </div>

          {/* Module 6: งานแผนยุทธศาสตร์ */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <LineChart className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">6. แผนยุทธศาสตร์และตัวชี้วัด</h3>
              <p className="text-xs text-slate-500 mt-1">
                แผนยุทธศาสตร์คณะ 4 ประเด็น, ติดตามตัวชี้วัดความสำเร็จของคณะ, สรุปข้อมูลสำหรับผู้บริหาร
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">4 ประเด็นยุทธศาสตร์</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">KPI Dashboard</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">ความก้าวหน้า 78%</span>
              <Link
                href="/plan"
                className="text-xs text-slate-700 hover:text-blue-900 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors"
              >
                ดูแผนงาน →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inbound / Outbound Documents Workflow */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              การไหลเวียนเอกสารสารบรรณล่าสุด (Saraban Document Routing)
            </h2>
            <p className="text-xs text-slate-500">
              เอกสารที่รับเข้ามาในคณะ และการแทงเรื่องไปยังฝ่ายการเงิน พัสดุ และสาขาวิชา
            </p>
          </div>
          <Link
            href="/admin/inbound"
            className="text-xs text-blue-900 font-semibold hover:underline"
          >
            ดูทะเบียนหนังสือทั้งหมด →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-3 font-semibold">เลขรับ / วันที่</th>
                <th className="py-2.5 px-3 font-semibold">เลขที่ต้นทาง</th>
                <th className="py-2.5 px-3 font-semibold">เรื่อง</th>
                <th className="py-2.5 px-3 font-semibold">หน่วยงานส่ง</th>
                <th className="py-2.5 px-3 font-semibold">แทงเรื่อง / ส่งต่อ</th>
                <th className="py-2.5 px-3 font-semibold">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {MOCK_INBOUND_DOCS.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-slate-900">
                    <div>{doc.receiveNumber}</div>
                    <div className="text-[10px] text-slate-400">{doc.receiveDate}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{doc.docNumber}</td>
                  <td className="py-3 px-3 font-medium text-slate-900 max-w-xs truncate">
                    {doc.title}
                  </td>
                  <td className="py-3 px-3 text-slate-600 truncate max-w-[150px]">{doc.sender}</td>
                  <td className="py-3 px-3">
                    <span className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-medium truncate max-w-[140px]">
                      {doc.assignedDept || "สำนักงานคณบดี"}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      doc.status === "forwarded" 
                        ? "bg-blue-50 text-blue-800" 
                        : doc.status === "signed" 
                        ? "bg-emerald-50 text-emerald-800" 
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {doc.status === "forwarded" ? "แทงเรื่องแล้ว" : doc.status === "signed" ? "ลงนามแล้ว" : "เสร็จสิ้น"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
