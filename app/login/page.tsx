"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Mail, User, Building2, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { loginWithEmail, registerWithEmail } from "@/lib/firebaseAuthService";
import { useRole } from "@/components/RoleContext";
import { UserRole } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, isLoading } = useRole();

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace(currentUser.role === "admin" ? "/admin" : "/");
    }
  }, [currentUser, isLoading, router]);

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Login Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register Form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("admin");
  const [regDepartment, setRegDepartment] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const userProfile = await loginWithEmail(email, password);
      setCurrentUser(userProfile);
      router.push(userProfile.role === "admin" ? "/admin" : "/");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setErrorMsg("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else if (err.code === "auth/user-not-found") {
        setErrorMsg("ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณากดแท็บ 'ลงทะเบียน' เพื่อสร้างบัญชีใหม่");
      } else {
        setErrorMsg(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (regPassword !== regConfirmPassword) {
      setErrorMsg("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    setLoading(true);

    try {
      const userProfile = await registerWithEmail(regName, regEmail, regPassword, regRole, regDepartment);
      setCurrentUser(userProfile);
      setSuccessMsg("สร้างบัญชีผู้ใช้สำเร็จ กำลังเข้าสู่ระบบ...");
      setTimeout(() => {
        router.push(userProfile.role === "admin" ? "/admin" : "/");
      }, 1000);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMsg("อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ");
      } else if (err.code === "auth/weak-password") {
        setErrorMsg("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      } else {
        setErrorMsg(err.message || "เกิดข้อผิดพลาดในการลงทะเบียน");
      }
    } finally {
      setLoading(false);
    }
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

        {/* Tab Switcher: Login / Register */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setIsRegisterMode(false); setErrorMsg(""); setSuccessMsg(""); }}
            className={`py-2 rounded-lg transition-all ${
              !isRegisterMode ? "bg-white text-blue-900 shadow-subtle" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(true); setErrorMsg(""); setSuccessMsg(""); }}
            className={`py-2 rounded-lg transition-all ${
              isRegisterMode ? "bg-white text-blue-900 shadow-subtle" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ลงทะเบียนผู้ใช้ใหม่
          </button>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {!isRegisterMode && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">อีเมลผู้ใช้งาน</label>
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
              disabled={loading}
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {isRegisterMode && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">ชื่อ - นามสกุล (พร้อมคำนำหน้า/ยศ)</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">บทบาทหน้าที่ในระบบ (Role)</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-900 bg-white"
              >
                <option value="admin">แอดมิน (เจ้าหน้าที่ธุรการและสารบรรณ)</option>
                <option value="dean">คณบดี (ผู้บริหารคณะ)</option>
                <option value="lecturer">อาจารย์ประจำสาขาวิชา</option>
                <option value="gov_officer">พนักงานราชการ (สายสนับสนุน / การเงิน / พัสดุ)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">หน่วยงาน / สาขาวิชา</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">อีเมลมหาวิทยาลัย</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">ยืนยันรหัสผ่าน</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? "กำลังสร้างบัญชี..." : "สร้างบัญชีและเข้าสู่ระบบ"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
