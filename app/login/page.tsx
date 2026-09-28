"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ShieldCheck, Lock, Mail, ArrowRight, UserCheck } from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { UserRole } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { switchRole, allUsers, setViewMode } = useRole();

  const [email, setEmail] = useState("admin.saraban@cpru.ac.th");
  const [password, setPassword] = useState("••••••••");

  const handleDemoLogin = (role: UserRole, mode?: "admin_only" | "full_suite") => {
    switchRole(role);
    if (mode) {
      setViewMode(mode);
    }
    router.push(role === "admin" ? "/admin" : "/");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default to admin
    switchRole("admin");
    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-card space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center mx-auto shadow-sm">
            <GraduationCap className="w-6 h-6 text-blue-100" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            ระบบบริหารจัดการคณะ (ERP)
          </h1>
          <p className="text-xs text-slate-500">
            คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ
          </p>
        </div>

        {/* Quick Demo Role Logins (For Presentation / Grading) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            เลือกเข้าสู่ระบบด่วน (Quick Demo Login)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoLogin("admin", "admin_only")}
              className="p-2.5 bg-blue-900 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors text-left flex flex-col justify-between"
            >
              <span>แอดมิน / ธุรการ</span>
              <span className="text-[10px] text-blue-200 font-normal">โหมดนำเสนอ</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin("dean", "full_suite")}
              className="p-2.5 bg-white border border-slate-200 text-slate-800 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-left flex flex-col justify-between"
            >
              <span>คณบดี</span>
              <span className="text-[10px] text-slate-400 font-normal">ผู้อนุมัติ/ลงนาม</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin("lecturer", "full_suite")}
              className="p-2.5 bg-white border border-slate-200 text-slate-800 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-left flex flex-col justify-between"
            >
              <span>อาจารย์</span>
              <span className="text-[10px] text-slate-400 font-normal">เสนอโครงการ/ใบลา</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin("gov_officer", "full_suite")}
              className="p-2.5 bg-white border border-slate-200 text-slate-800 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-left flex flex-col justify-between"
            >
              <span>พนักงานราชการ</span>
              <span className="text-[10px] text-slate-400 font-normal">การเงินและพัสดุ</span>
            </button>
          </div>
        </div>

        {/* Regular Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">อีเมลมหาวิทยาลัย</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>เข้าสู่ระบบ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
