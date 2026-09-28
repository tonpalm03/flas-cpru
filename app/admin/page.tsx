"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Inbox, 
  Send, 
  FileEdit, 
  BookmarkCheck, 
  CalendarDays, 
  Plus, 
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck,
  Settings,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Share2
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { 
  getInboundDocs, 
  getOutboundDocs, 
  getRoomBookings, 
  getOrders, 
  getMemos 
} from "@/lib/firebaseService";
import { InboundDocument, OutboundDocument, RoomBooking, OfficialOrder, OfficialMemo } from "@/lib/types";

export default function AdminModuleHub() {
  const { currentUser, isAdmin } = useRole();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inboundDocs, setInboundDocs] = useState<InboundDocument[]>([]);
  const [outboundDocs, setOutboundDocs] = useState<OutboundDocument[]>([]);
  const [rooms, setRooms] = useState<RoomBooking[]>([]);
  const [orders, setOrders] = useState<OfficialOrder[]>([]);
  const [memos, setMemos] = useState<OfficialMemo[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [inList, outList, roomList, orderList, memoList] = await Promise.all([
          getInboundDocs(),
          getOutboundDocs(),
          getRoomBookings(),
          getOrders(),
          getMemos()
        ]);
        setInboundDocs(inList);
        setOutboundDocs(outList);
        setRooms(roomList);
        setOrders(orderList);
        setMemos(memoList);
      } catch (err: any) {
        console.error("Error loading admin stats:", err);
        setError("ไม่สามารถโหลดข้อมูลสถิติธุรการได้ โปรดลองอีกครั้ง");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (!currentUser) {
    return null;
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const pendingInboundCount = inboundDocs.filter(d => d.status === "pending_review" || d.status === "forwarded").length;
  const pendingOutboundCount = outboundDocs.filter(d => d.status === "draft" || d.status === "pending_review").length;
  const activeRoomsToday = rooms.filter(r => r.date === todayStr && r.status === "approved").length;
  const activeOrdersCount = orders.filter(o => o.status === "active").length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900">
              สำนักงานคณบดี
            </span>
            <span className="text-xs text-slate-400">• งานสารบรรณและธุรการกลาง</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            ศูนย์บริหารงานธุรการและสารบรรณ (Admin Hub)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            จัดการหนังสือรับ-ส่ง ออกเลขที่ราชการ สร้างบันทึกข้อความ ทะเบียนคำสั่ง และระบบจองยานพาหนะ/ห้องประชุม
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/memo-generator"
            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างบันทึกข้อความ</span>
          </Link>
          <Link
            href="/admin/inbound"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-all"
          >
            <Inbox className="w-4 h-4 text-blue-900" />
            <span>ลงรับหนังสือใหม่</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Overview Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">หนังสือรับทั้งหมด</span>
            <Inbox className="w-4 h-4 text-blue-900" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {loading ? "..." : inboundDocs.length}
          </p>
          <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> รอดำเนินการ {loading ? "..." : pendingInboundCount} ฉบับ
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">หนังสือส่งออก</span>
            <Send className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {loading ? "..." : outboundDocs.length}
          </p>
          <p className="text-[11px] text-blue-800 font-medium mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> รอลงนาม/ส่ง {loading ? "..." : pendingOutboundCount} ฉบับ
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">คำสั่งคณะที่มีผล</span>
            <BookmarkCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {loading ? "..." : activeOrdersCount}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> ประกาศใช้งานสมบูรณ์
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">การจองห้อง/รถวันนี้</span>
            <CalendarDays className="w-4 h-4 text-indigo-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {loading ? "..." : activeRoomsToday}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            รายการจองรวม {loading ? "..." : rooms.length} รายการ
          </p>
        </div>
      </div>

      {/* Admin 9 Menu Suite Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">
            ระบบงานสารบรรณและธุรการครบวงจร (9 ฟังก์ชันหลัก)
          </h2>
          <span className="text-xs text-slate-500">สอดคล้องระเบียบงานสารบรรณ มรภ.ชัยภูมิ</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Inbound */}
          <Link
            href="/admin/inbound"
            className="bg-white border border-slate-200 hover:border-blue-900/40 rounded-2xl p-5 shadow-card transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center mb-3">
                <Inbox className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                1. ทะเบียนหนังสือรับ (Inbound)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ลงทะเบียนรับหนังสือเข้า, ออกเลขรับอัตโนมัติ (รับ xxx/2569), แนบไฟล์ต้นฉบับ, และแทงเรื่องต่อไปยังฝ่ายการเงิน/พัสดุ/สาขา
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-blue-900 font-semibold">{inboundDocs.length} ฉบับในระบบ</span>
              <span className="text-xs text-slate-400 group-hover:text-blue-900 flex items-center gap-1 font-medium">
                เปิดระบบ <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* 2. Outbound */}
          <Link
            href="/admin/outbound"
            className="bg-white border border-slate-200 hover:border-blue-900/40 rounded-2xl p-5 shadow-card transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <Send className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                2. ทะเบียนหนังสือส่ง (Outbound)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ออกเลขหนังสือส่งภายนอกและภายในคณะ (อว 0643.04/xxx), บันทึกผู้ลงนาม, ติดตามสถานะ, และแนบฉบับลงนาม
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">{outboundDocs.length} ฉบับส่งออก</span>
              <span className="text-xs text-slate-400 group-hover:text-blue-900 flex items-center gap-1 font-medium">
                เปิดระบบ <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* 3. Memo Generator */}
          <Link
            href="/admin/memo-generator"
            className="bg-white border-2 border-blue-900/20 hover:border-blue-900 rounded-2xl p-5 shadow-card transition-all group flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-blue-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl">
              5 แม่แบบมาตรฐาน
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center mb-3">
                <FileEdit className="w-5 h-5 text-blue-900" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                3. สร้างบันทึกข้อความราชการ (Word / PDF)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                สร้างบันทึกข้อความตราครุฑ: เชิญวิทยากรเดี่ยว/หลายท่าน, ขอเวลาเรียน, ไปราชการ, เสนออธิการบดีลงนาม พร้อมบันทึกร่าง
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-blue-900 font-semibold">{memos.length} ร่างบันทึกข้อความ</span>
              <span className="text-xs text-blue-900 flex items-center gap-1 font-medium">
                สร้างเอกสาร <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* 4. Orders */}
          <Link
            href="/admin/orders"
            className="bg-white border border-slate-200 hover:border-blue-900/40 rounded-2xl p-5 shadow-card transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <BookmarkCheck className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                4. ทะเบียนคำสั่ง / ประกาศคณะ
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ออกเลขคำสั่งแต่งตั้งกรรมการดำเนินงาน, กรรมการตรวจรับพัสดุ, ประกาศแนวปฏิบัติ, และระบบยกเลิก/เพิกถอนคำสั่ง
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">{orders.length} รายการคำสั่ง</span>
              <span className="text-xs text-slate-400 group-hover:text-blue-900 flex items-center gap-1 font-medium">
                เปิดคลังคำสั่ง <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* 5. Rooms & Vehicles */}
          <Link
            href="/admin/rooms"
            className="bg-white border border-slate-200 hover:border-blue-900/40 rounded-2xl p-5 shadow-card transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <CalendarDays className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                5. จองห้องประชุม / ยานพาหนะคณะ
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ปฏิทินจองห้องประชุมสิริวิชาญ, Smart Classroom 421, และรถตู้คณะ พร้อมระบบตรวจเวลาทับซ้อนและระบุพนักงานขับรถ
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">{rooms.length} รายการจอง</span>
              <span className="text-xs text-slate-400 group-hover:text-blue-900 flex items-center gap-1 font-medium">
                เปิดปฏิทินจอง <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* 6. Responses */}
          <Link
            href="/admin/responses"
            className="bg-white border border-slate-200 hover:border-blue-900/40 rounded-2xl p-5 shadow-card transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <FileCheck className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                6. แบบตอบรับเข้าร่วม / วิทยากร / สถานที่
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ทะเบียนตอบรับและปฏิเสธ พร้อมรายชื่อผู้เข้าร่วม เบอร์โทรศัพท์ และเงื่อนไขค่าตอบแทน ส่งออก Word & PDF
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">แบบตอบรับ 3 ชนิด</span>
              <span className="text-xs text-slate-400 group-hover:text-blue-900 flex items-center gap-1 font-medium">
                สร้างแบบตอบรับ <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* 7. Checklists */}
          <Link
            href="/admin/checklists"
            className="bg-white border border-slate-200 hover:border-blue-900/40 rounded-2xl p-5 shadow-card transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                7. ใบตรวจสอบเอกสาร (Checklists)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ตรวจเอกสาร 12 รายการตามแบบมาตรฐาน CPRU: สัญญายืมเงิน, ใบเบิกจ่าย, เดินทางราชการ, ค่าตอบแทนการสอน
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">4 หมวดหมู่ตรวจสอบ</span>
              <span className="text-xs text-slate-400 group-hover:text-blue-900 flex items-center gap-1 font-medium">
                พิมพ์ใบปะหน้าตรวจ <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* 8. Templates Manager */}
          <Link
            href="/admin/templates"
            className="bg-white border border-slate-200 hover:border-blue-900/40 rounded-2xl p-5 shadow-card transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <Settings className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                8. จัดการแม่แบบเอกสารส่วนกลาง (Templates)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                กำหนดหัวหนังสือ ผู้ลงนาม (คณบดี) รหัสหนังสือราชการ (อว 0643.04/) ปีงบประมาณ และอัตราภาษีส่วนกลาง
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">
                {isAdmin ? "สิทธิเฉพาะแอดมิน" : "อ่านค่าส่วนกลาง"}
              </span>
              <span className="text-xs text-slate-400 group-hover:text-blue-900 flex items-center gap-1 font-medium">
                ตั้งค่าแม่แบบ <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* 9. Cross-Module Document Dispatch */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center mb-3">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">
                9. ระบบแทงเรื่องและส่งต่องาน (Cross-Module Dispatch)
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                ส่งต่องานหนังสือรับไปยังฝ่ายการเงิน (เบิกจ่าย), ฝ่ายพัสดุ (ขอซื้อขอจ้าง), หรือฝ่ายยุทธศาสตร์โครงการแบบ Real-time
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-blue-200">เชื่อมต่อ 6 โมดุล</span>
              <Link href="/admin/inbound" className="text-xs text-white hover:underline flex items-center gap-1 font-semibold">
                แทงเรื่องในระบบรับ <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
