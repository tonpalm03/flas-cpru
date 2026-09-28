"use client";

import React, { useState } from "react";
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Calendar,
  LogOut,
  User,
  Building2,
  Mail
} from "lucide-react";
import { useRole } from "./RoleContext";
import { UserRole } from "@/lib/types";

export default function Navbar() {
  const { currentUser, logout } = useRole();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!currentUser) return null;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return { label: "แอดมิน / ธุรการ", style: "bg-blue-100 text-blue-900 border-blue-200" };
      case "dean":
        return { label: "คณบดี", style: "bg-slate-100 text-slate-800 border-slate-300" };
      case "lecturer":
        return { label: "อาจารย์", style: "bg-slate-100 text-slate-800 border-slate-300" };
      case "gov_officer":
        return { label: "พนักงานราชการ", style: "bg-slate-100 text-slate-800 border-slate-300" };
      default:
        return { label: "บุคลากร", style: "bg-slate-100 text-slate-800 border-slate-300" };
    }
  };

  const currentBadge = getRoleBadge(currentUser.role);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่หนังสือ, ชื่อโครงการ, ผู้รับผิดชอบ..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Fiscal Year Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-blue-700" />
          <span>ปีงบประมาณ พ.ศ. 2569</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 bg-blue-700 rounded-full absolute top-2 right-2 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-float p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900">การแจ้งเตือน (3)</span>
                <span className="text-[10px] text-blue-700 cursor-pointer hover:underline">อ่านทั้งหมด</span>
              </div>
              <div className="divide-y divide-slate-50 py-1 max-h-64 overflow-y-auto">
                <div className="py-2 text-xs">
                  <p className="font-medium text-slate-800">มีหนังสือรับใหม่: ชี้แจง ค.ยุทธศาสตร์ 69</p>
                  <p className="text-[10px] text-slate-400">จาก กองนโยบายและแผน • 10 นาทีที่แล้ว</p>
                </div>
                <div className="py-2 text-xs">
                  <p className="font-medium text-slate-800">สัญญายืมเงิน ยม.018/2569 ได้รับอนุมัติ</p>
                  <p className="text-[10px] text-slate-400">ฝ่ายการเงิน • 1 ชม. ที่แล้ว</p>
                </div>
                <div className="py-2 text-xs">
                  <p className="font-medium text-slate-800">จองห้องประชุมสิริวิชาญ 30 ก.ย. อนุมัติแล้ว</p>
                  <p className="text-[10px] text-slate-400">งานธุรการ • เมื่อวานนี้</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Button (No Role Switcher - Pure Real Profile & Logout) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                  {currentUser.name}
                </p>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${currentBadge.style}`}>
                  {currentBadge.label}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate max-w-[160px]">
                {currentUser.department}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-float p-3 z-50 animate-in fade-in zoom-in-95 space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.roleTitle}</p>
                <p className="text-[10px] text-slate-400 mt-1">{currentUser.email}</p>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  setShowProfileDropdown(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
