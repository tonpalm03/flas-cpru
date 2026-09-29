"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, 
  FolderKanban, 
  Wallet, 
  Package, 
  Users, 
  LineChart, 
  Home, 
  Inbox, 
  Send, 
  FileEdit, 
  BookmarkCheck, 
  CalendarDays,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Layers,
  Settings,
  CheckSquare,
  FileCheck
} from "lucide-react";
import { useRole } from "./RoleContext";

interface NavSubItem {
  title: string;
  href: string;
  badge?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useRole();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    admin: true,
    projects: true,
    finance: true,
    procurement: false,
    hr: false,
    plan: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allSections: Array<{ key: string; label: string; icon: any; isMyPart?: boolean; subItems: NavSubItem[] }> = [
    {
      key: "admin",
      label: "งานธุรการและสารบรรณ",
      icon: FileText,
      isMyPart: true,
      subItems: [
        { title: "แดชบอร์ดงานธุรการ", href: "/admin" },
        { title: "ทะเบียนหนังสือรับ", href: "/admin/inbound", badge: "4 ใหม่" },
        { title: "ทะเบียนหนังสือส่ง", href: "/admin/outbound" },
        { title: "สร้างบันทึกข้อความ (Word/PDF)", href: "/admin/memo-generator" },
        { title: "แบบตอบรับวิทยากร/สถานที่", href: "/admin/responses" },
        { title: "เช็คลิสต์ตรวจเอกสาร", href: "/admin/checklists" },
        { title: "จัดการแม่แบบเอกสาร (แอดมิน)", href: "/admin/templates" },
        { title: "ทะเบียนคำสั่ง/ประกาศคณะ", href: "/admin/orders" },
        { title: "จองห้องประชุม/ยานพาหนะ", href: "/admin/rooms" },
      ]
    },
    {
      key: "projects",
      label: "งานโครงการและกิจกรรม",
      icon: FolderKanban,
      subItems: [
        { title: "โครงการยุทธศาสตร์ 2569", href: "/projects" },
        { title: "เขียนเสนอโครงการ (Word)", href: "/projects/new" },
        { title: "รายงานผลโครงการ & SDG", href: "/projects/reports" },
      ]
    },
    {
      key: "finance",
      label: "งานการเงินและงบประมาณ",
      icon: Wallet,
      subItems: [
        { title: "คุมงบประมาณรายได้ 2568", href: "/finance" },
        { title: "สัญญายืมเงินทดรอง", href: "/finance/loans" },
        { title: "เบิกค่าสอน / ค่านิเทศ", href: "/finance/disbursement" },
      ]
    },
    {
      key: "procurement",
      label: "งานพัสดุและจัดซื้อ",
      icon: Package,
      subItems: [
        { title: "ขอซื้อ-ขอจ้าง (จัดซื้อ)", href: "/procurement" },
      ]
    },
    {
      key: "hr",
      label: "งานบริหารงานบุคคล & ลงเวลา",
      icon: Users,
      subItems: [
        { title: "ลงเวลาเข้า-ออกงาน", href: "/attendance" },
        { title: "ประวัติลงเวลา / ขอแก้ไข", href: "/attendance/history" },
        { title: "ยื่นใบลา (พักผ่อน/ป่วย/กิจ)", href: "/hr" },
        { title: "ตรวจรับรองเวลา & คำขอ (HR)", href: "/hr/attendance" },
        { title: "สรุปเวลารายเดือน & ปิดงวด (HR)", href: "/hr/attendance/reports" },
        { title: "ตั้งตารางงาน & นโยบาย (HR)", href: "/hr/work-schedules" },
        { title: "แฟ้มประวัติและผลงาน (SAR)", href: "/hr/portfolio" },
      ]
    },
    {
      key: "settings",
      label: "ตั้งค่าระบบและผู้ใช้งาน",
      icon: Settings,
      subItems: [
        { title: "ข้อมูลส่วนตัว (Profile)", href: "/account/profile" },
        { title: "จัดการบัญชีผู้ใช้ & สิทธิ์", href: "/settings/users" },
      ]
    },
    {
      key: "plan",
      label: "งานแผนและตัวชี้วัด",
      icon: LineChart,
      subItems: [
        { title: "ยุทธศาสตร์คณะ 4 ด้าน", href: "/plan" },
      ]
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-sm flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-blue-100" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-semibold text-sm text-slate-900 truncate leading-tight">
            คณะศิลปศาสตร์ฯ
          </h1>
          <p className="text-[11px] text-slate-500 font-medium truncate">
            ระบบบริหารงานคณะ (ERP)
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
        {/* Main Portal Dashboard */}
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/"
              ? "bg-blue-50 text-blue-900 font-semibold"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Home className={`w-4 h-4 ${pathname === "/" ? "text-blue-700" : "text-slate-400"}`} />
          <span>หน้าหลักทั้งคณะ</span>
        </Link>

        <div className="pt-2 pb-1 px-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            โมดูลงานในคณะ
          </p>
        </div>

        {/* Core Modules List */}
        {allSections.map((section) => {
          const Icon = section.icon;
          const isOpen = openSections[section.key];
          const hasActiveChild = section.subItems.some((sub) => pathname === sub.href);

          return (
            <div key={section.key} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  hasActiveChild
                    ? "bg-blue-50/70 text-blue-900 font-semibold"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      hasActiveChild ? "text-blue-700" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{section.label}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Sub items */}
              {isOpen && (
                <div className="pl-6 pr-1 space-y-0.5">
                  {section.subItems.map((sub) => {
                    const isActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-blue-900 text-white shadow-sm font-medium"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <span className="truncate">{sub.title}</span>
                        {sub.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                              isActive
                                ? "bg-white text-blue-900"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {sub.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            เชื่อมต่อ Cloud Firestore
          </span>
          <span className="text-[10px] text-slate-400 font-mono">v1.0</span>
        </div>
      </div>
    </aside>
  );
}
