"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  FileText, 
  FolderKanban, 
  Wallet, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  Home, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Sparkles,
  Server
} from "lucide-react";

export default function FlowPage() {
  const [scale, setScale] = useState(1);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 text-xs font-bold rounded-full">
              สถาปัตยกรรมระบบ 6 โมดูลแบบบูรณาการ
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-medium">ผังรวมเบ็ดเสร็จ (Unified Master Flow)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-950">
            ผังการทำงานระบบบริหารจัดการคณะ (ERP Flow Map)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ
          </p>
        </div>

        {/* Font / Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(s + 0.1, 1.3))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>ขยาย (+)</span>
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(s - 0.1, 0.85))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            <ZoomOut className="w-3.5 h-3.5" />
            <span>ย่อ (-)</span>
          </button>
          <button
            type="button"
            onClick={() => setScale(1)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
            title="รีเซ็ตขนาดปกติ"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <Link
            href="/"
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all ml-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>หน้าหลัก</span>
          </Link>
        </div>
      </div>

      {/* Dynamic Scaling Flow Container */}
      <div 
        className="space-y-6 transition-all origin-top"
        style={{ fontSize: `${scale * 14}px` }}
      >
        {/* FLOW 1 */}
        <div className="bg-white border-2 border-blue-900/20 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                1
              </div>
              <div>
                <h2 className="text-base font-bold text-blue-950">
                  โฟลว์ที่ 1: การยืนยันตัวตนและการกระจายสิทธิ์ (Authentication & Role Guard)
                </h2>
                <p className="text-xs text-slate-500">ตรวจสอบตัวตนและนำทางผู้ใช้ไปยังโมดูลตามหน้าที่</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-mono rounded-lg">/login</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-blue-900 uppercase">ขั้นตอนที่ 1.1</span>
              <h4 className="font-bold text-slate-900">ผู้ใช้เข้าสู่ระบบ</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                เข้าสู่เว็บไซต์ หากยังไม่ได้ล็อกอิน ระบบจะล็อกเส้นทางและนำเข้าหน้า <code>/login</code>
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-blue-900 uppercase">ขั้นตอนที่ 1.2</span>
              <h4 className="font-bold text-slate-900">กรอกรหัส / ลงทะเบียน</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                รองรับรหัสแอดมิน (<code>tonpalm03</code>) หรืออีเมลมหาวิทยาลัย พร้อมระบบยืนยันรหัสผ่าน
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-blue-900 uppercase">ขั้นตอนที่ 1.3</span>
              <h4 className="font-bold text-slate-900">ดึงข้อมูลสิทธิ์ (Role)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                อ่านสิทธิ์จาก Firestore ตาราง <code>users</code>: แอดมิน, คณบดี, อาจารย์, หรือพนักงาน
              </p>
            </div>
            <div className="p-4 bg-blue-900 text-white rounded-xl space-y-1.5 shadow-sm">
              <span className="text-[11px] font-bold text-blue-200 uppercase">ขั้นตอนที่ 1.4</span>
              <h4 className="font-bold text-white">ส่งเข้าเมนูตามสิทธิ์</h4>
              <p className="text-xs text-blue-100 leading-relaxed">
                แอดมินเข้าหน้า <code>/admin</code> ส่วนบุคลากรทั่วไปเข้าหน้าภาพรวมทั้งคณะ <code>/</code>
              </p>
            </div>
          </div>
        </div>

        {/* FLOW 2 */}
        <div className="bg-white border-2 border-indigo-900/20 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                2
              </div>
              <div>
                <h2 className="text-base font-bold text-indigo-950">
                  โฟลว์ที่ 2: ศูนย์กลางงานธุรการและสารบรรณ (Administrative Hub)
                </h2>
                <p className="text-xs text-slate-500">รับ-ส่งหนังสือราชการ สร้างตราครุฑ และคุมต้นแบบเอกสารคณะ</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-mono rounded-lg">/admin/*</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-indigo-950">1. ทะเบียนหนังสือรับ</h4>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">/admin/inbound</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                รับหนังสือจากภายนอก $\rightarrow$ บันทึกลง <code>admin_documents_in</code> $\rightarrow$ เกษียณและส่งต่อเรื่องไปยังฝ่ายการเงิน, พัสดุ, หรือโครงการ
              </p>
            </div>

            <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-indigo-950">2. บันทึกข้อความตราครุฑ</h4>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">/admin/memo-generator</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                กรอกเนื้อหา $\rightarrow$ ดึงต้นแบบจาก <code>templates</code> $\rightarrow$ ประมวลผลออกเป็นไฟล์ Word (.docx) และ PDF ตราครุฑทันที
              </p>
            </div>

            <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-indigo-950">3. ออกเลขหนังสือส่ง</h4>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">/admin/outbound</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                ออกเลขทะเบียนหนังสือส่งทางการ (เช่น <code>อว 0643.04/xxx</code>) บันทึกลง <code>admin_documents_out</code>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 text-xs block">จัดการแม่แบบเอกสาร (/admin/templates):</span>
              <p className="text-xs text-slate-600 mt-0.5">
                แอดมินสามารถปรับเปลี่ยนชื่อคณบดี, คำนำหน้าเลขที่เอกสาร, อัตราภาษี VAT 7% และหัก ณ ที่จ่าย 1% ได้จากจุดนี้
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xs block">จองห้องประชุมและยานพาหนะ (/admin/rooms):</span>
              <p className="text-xs text-slate-600 mt-0.5">
                ตรวจสอบตารางการใช้งานห้องประชุมของคณะและจองใช้งานแบบออนไลน์ บันทึกลง <code>rooms</code>
              </p>
            </div>
          </div>
        </div>

        {/* FLOW 3 */}
        <div className="bg-white border-2 border-emerald-900/20 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                3
              </div>
              <div>
                <h2 className="text-base font-bold text-emerald-950">
                  โฟลว์ที่ 3: งานโครงการและแผนยุทธศาสตร์ (Projects & Strategy)
                </h2>
                <p className="text-xs text-slate-500">เขียนเสนอโครงการ ผูกกับยุทธศาสตร์ 4 ด้าน และส่งรายงานผล SDG</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-mono rounded-lg">/projects/* & /plan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">ขั้นตอนที่ 3.1</span>
              <h4 className="font-bold text-slate-900">เชื่อมโยงยุทธศาสตร์คณะ</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ดูตัวชี้วัดยุทธศาสตร์ 4 ด้านที่ <code>/plan</code> เพื่อเลือกเป้าหมายที่โครงการตอบสนอง
              </p>
            </div>
            <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">ขั้นตอนที่ 3.2</span>
              <h4 className="font-bold text-slate-900">เขียนแบบเสนอโครงการ</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                กรอกข้อมูลที่ <code>/projects/new</code> ระบบจะ Generate ไฟล์โครงการ Word .docx พร้อมบันทึกลง <code>projects</code>
              </p>
            </div>
            <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">ขั้นตอนที่ 3.3</span>
              <h4 className="font-bold text-slate-900">ดำเนินงาน & สรุปผล SDG</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                จัดกิจกรรมเสร็จ ยื่นสรุปผลโครงการที่ <code>/projects/reports</code> เพื่อส่งข้อมูลไปตัดยอดงบประมาณ
              </p>
            </div>
          </div>
        </div>

        {/* FLOW 4 */}
        <div className="bg-white border-2 border-amber-900/20 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-800 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                4
              </div>
              <div>
                <h2 className="text-base font-bold text-amber-950">
                  โฟลว์ที่ 4: งานพัสดุและการเงินงบประมาณ (Procurement & Finance)
                </h2>
                <p className="text-xs text-slate-500">ยืมเงินทดรองจ่าย ขอซื้อพัสดุ เบิกจ่ายค่าสอน และคุมทะเบียนงบประมาณรายได้</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-mono rounded-lg">/finance/* & /procurement</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-1.5">
              <h4 className="font-bold text-slate-900">1. ยืมเงินทดรองจ่าย</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ทำสัญญาที่ <code>/finance/loans</code> ตรวจเช็คลิสต์ 4 ข้อ บันทึกลง <code>finance_loans</code>
              </p>
            </div>
            <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-1.5">
              <h4 className="font-bold text-slate-900">2. ขอซื้อ-ขอจ้างพัสดุ</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                เปิดใบ PR ที่ <code>/procurement</code> คำนวณ VAT 7% อัตโนมัติ บันทึกลง <code>procurement</code>
              </p>
            </div>
            <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-1.5">
              <h4 className="font-bold text-slate-900">3. เบิกค่าสอน/ค่านิเทศ</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                คำนวณเงินที่ <code>/finance/disbursement</code> พร้อมหักภาษี 1% ออกใบฎีกา
              </p>
            </div>
            <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-1.5">
              <h4 className="font-bold text-slate-900">4. ทะเบียนคุมงบประมาณ</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                คุมงบรายได้ 2568 ที่ <code>/finance</code> สรุปยอดคงเหลือและส่งออกไฟล์ Excel (.xlsx)
              </p>
            </div>
          </div>
        </div>

        {/* FLOW 5 */}
        <div className="bg-white border-2 border-purple-900/20 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                5
              </div>
              <div>
                <h2 className="text-base font-bold text-purple-950">
                  โฟลว์ที่ 5: งานบริหารบุคคลและแฟ้มสะสมงาน (HR & SAR Portfolio)
                </h2>
                <p className="text-xs text-slate-500">ระบบยื่นใบลาอิเล็กทรอนิกส์ (e-Leave) และจัดทำแฟ้มประเมินผลงานอาจารย์</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-mono rounded-lg">/hr & /hr/portfolio</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-xl space-y-1.5">
              <h4 className="font-bold text-slate-900">ระบบ e-Leave (ยื่นใบลา)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                อาจารย์/เจ้าหน้าที่ยื่นลาพักผ่อน/ป่วย/กิจ $\rightarrow$ บันทึกลง <code>hr_leaves</code> $\rightarrow$ ออกใบลา PDF พร้อมพิมพ์ $\rightarrow$ เสนอคณบดีอนุมัติ
              </p>
            </div>
            <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-xl space-y-1.5">
              <h4 className="font-bold text-slate-900">แฟ้มประวัติและผลงาน (SAR)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                รวบรวมภาระงานสอน วิจัย บริการวิชาการ และทำนุบำรุงศิลปวัฒนธรรม $\rightarrow$ ส่งออกเป็นรูปเล่ม SAR (.docx)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
