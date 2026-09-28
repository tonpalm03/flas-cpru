"use client";

import React from "react";
import Link from "next/link";
import { 
  FileText, 
  Inbox, 
  Send, 
  FileEdit, 
  BookmarkCheck, 
  CalendarDays, 
  Plus, 
  Search, 
  ArrowRight,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useRole } from "@/components/RoleContext";

export default function AdminModuleHub() {
  const { currentUser } = useRole();

  if (!currentUser) {
    return null;
  }
  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900">
              สำนักงานคณบดี
            </span>
            <span className="text-xs text-slate-400">• งานสารบรรณและธุรการ</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            ศูนย์บริหารงานธุรการและสารบรรณ (Admin Hub)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            จัดการหนังสือรับ-ส่ง ออกเลขที่ราชการ สร้างบันทึกข้อความ และแทงเรื่องไปยังฝ่ายการเงิน พัสดุ และโครงการ
          </p>
        </div>

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
            <Inbox className="w-4 h-4 text-blue-700" />
            <span>ลงรับหนังสือใหม่</span>
          </Link>
        </div>
      </div>

      {/* Admin Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Inbound Card */}
        <Link
          href="/admin/inbound"
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-card transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center mb-3">
              <Inbox className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
              1. ทะเบียนหนังสือรับ (Inbound)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ลงทะเบียนรับหนังสือจากภายนอก/มหาวิทยาลัย, ออกเลขรับ, อัปโหลดเอกสารต้นฉบับ, และแทงเรื่องต่อไปยังฝ่ายที่เกี่ยวข้อง
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-blue-800 font-semibold">{MOCK_INBOUND_DOCS.length} ฉบับในระบบ</span>
            <span className="text-xs text-slate-400 group-hover:text-blue-900 flex items-center gap-1 font-medium">
              เปิดดู <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Outbound Card */}
        <Link
          href="/admin/outbound"
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-card transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
              <Send className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
              2. ทะเบียนหนังสือส่ง (Outbound)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ออกเลขหนังสือส่งภายนอกและภายในคณะ, บันทึกผู้ลงนาม (คณบดี/รองคณบดี), และติดตามสถานะการส่งหนังสือ
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{MOCK_OUTBOUND_DOCS.length} ฉบับส่งออก</span>
            <span className="text-xs text-slate-400 group-hover:text-blue-900 flex items-center gap-1 font-medium">
              เปิดดู <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Memo Generator Card */}
        <Link
          href="/admin/memo-generator"
          className="bg-white border-2 border-blue-200 hover:border-blue-500 rounded-2xl p-5 shadow-card transition-all group flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-blue-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl">
            ฟีเจอร์เด่น
          </div>
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center mb-3">
              <FileEdit className="w-5 h-5 text-blue-800" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
              3. สร้างบันทึกข้อความ (Word / PDF)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              เครื่องมือสร้างบันทึกข้อความราชการตราครุฑอัตโนมัติ: หนังสือเชิญวิทยากร, ขอไปราชการ, ขอเวลาเรียน, แจ้ง นศ.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-blue-900 font-semibold">ส่งออก .docx / .pdf</span>
            <span className="text-xs text-blue-900 flex items-center gap-1 font-medium">
              สร้างทันที <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Orders Card */}
        <Link
          href="/admin/orders"
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-card transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
              <BookmarkCheck className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
              4. ทะเบียนคำสั่ง / ประกาศคณะ
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ออกเลขคำสั่งคณะ เช่น แต่งตั้งคณะกรรมการดำเนินงานโครงการ, ประกาศกิจกรรม และคลังค้นหาคำสั่งย้อนหลัง
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">คลังคำสั่ง 2569</span>
            <span className="text-xs text-slate-400 group-hover:text-blue-900 flex items-center gap-1 font-medium">
              เปิดดู <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Rooms Card */}
        <Link
          href="/admin/rooms"
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-card transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
              <CalendarDays className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
              5. จองห้องประชุม / รถคณะ
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ปฏิทินจองห้องประชุมสิริวิชาญ, ห้อง Smart Classroom, และขอใช้ยานพาหนะคณะสำหรับไปราชการ
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{MOCK_ROOMS.length} รายการจอง</span>
            <span className="text-xs text-slate-400 group-hover:text-blue-900 flex items-center gap-1 font-medium">
              เปิดดู <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>
      </div>

      {/* Integration Workflow View */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-2">
          <Sparkles className="w-4 h-4 text-blue-700" />
          <span>การไหลของข้อมูลจากระบบธุรการไปยังระบบอื่น (Cross-Module Workflow)</span>
        </div>
        <p className="text-xs text-slate-600 mb-4">
          เมื่อเจ้าหน้าที่ธุรการลงรับหนังสือหรือบันทึกข้อความ สามารถกำหนด "แทงเรื่อง/ส่งต่อ" เพื่อให้ฝ่ายปลายทางเห็นเอกสารทันที:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-sm">
            <p className="font-bold text-slate-800">ส่งต่อฝ่ายการเงิน</p>
            <p className="text-slate-500 text-[11px] mt-1">
              ส่งเอกสารขออนุมัติเบิกจ่ายค่าสอน, ขอยืมเงินทดรองราชการ หรือโอนเงินงบประมาณ
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-sm">
            <p className="font-bold text-slate-800">ส่งต่อฝ่ายพัสดุ</p>
            <p className="text-slate-500 text-[11px] mt-1">
              ส่งเอกสารขอซื้อขอจ้างพัสดุโครงการ เพื่อดำเนินการจัดซื้อตามระเบียบพัสดุ
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-sm">
            <p className="font-bold text-slate-800">ส่งต่อหัวหน้าโครงการ/สาขา</p>
            <p className="text-slate-500 text-[11px] mt-1">
              แจ้งเวียนหนังสือเชิญวิทยากร, หนังสือขอความอนุเคราะห์เวลาเรียน, หรือแนวปฏิบัติ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
