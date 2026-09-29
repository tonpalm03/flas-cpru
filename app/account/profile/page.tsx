"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  ShieldCheck, 
  Camera, 
  Save, 
  Check, 
  AlertCircle, 
  Clock, 
  Upload, 
  Trash2,
  Calendar,
  Briefcase,
  Layers,
  ArrowLeft,
  KeyRound,
  FileCheck
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { updateMyProfile, uploadDocumentFile } from "@/lib/firebaseService";

export default function MyProfilePage() {
  const { currentUser } = useRole();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [officeRoom, setOfficeRoom] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setPhoneNumber(currentUser.phoneNumber || "");
      setOfficeRoom(currentUser.officeRoom || "");
      setBio(currentUser.bio || "");
      setAvatarPreview(currentUser.avatarUrl || null);
    }
  }, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("ขนาดไฟล์ภาพต้องไม่เกิน 5 MB");
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("กรุณาเลือกไฟล์ภาพที่ถูกต้อง (JPG, PNG, WebP)");
      return;
    }

    setErrorMessage(null);
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setSaving(true);
      setErrorMessage(null);

      let finalAvatarUrl = avatarPreview || "";

      // If new file chosen, upload it
      if (avatarFile) {
        try {
          finalAvatarUrl = await uploadDocumentFile(avatarFile, "avatars", currentUser);
        } catch (uploadErr) {
          console.warn("Avatar upload fallback to local preview:", uploadErr);
        }
      }

      await updateMyProfile(
        currentUser.id,
        {
          phoneNumber,
          officeRoom,
          bio,
          avatarUrl: finalAvatarUrl,
          avatarVersion: (currentUser.avatarVersion || 1) + 1
        },
        currentUser
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Save profile error:", err);
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลโปรไฟล์");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-blue-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> หน้าหลัก
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-blue-900">บัญชีของฉัน</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            โปรไฟล์และข้อมูลผู้ใช้งาน (My Profile)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดการรูปประจำตัว ข้อมูลติดต่อ และตรวจสอบสิทธิ์การเข้าถึงระบบ
          </p>
        </div>

        <Link
          href="/attendance"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-900 text-xs font-semibold rounded-xl hover:bg-blue-100 transition-colors"
        >
          <Clock className="w-4 h-4 text-blue-700" />
          <span>ไปที่หน้าลงเวลาเข้า-ออก →</span>
        </Link>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium animate-fadeIn">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>บันทึกข้อมูลโปรไฟล์และรูปประจำตัวเรียบร้อยแล้ว</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Card & Avatar Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-card">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100">
            {/* Avatar Circle with Upload Trigger */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-100 flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="รูปประจำตัว"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-900 text-white font-bold text-3xl flex items-center justify-center">
                    {currentUser?.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-blue-900 text-white rounded-full shadow-md hover:bg-blue-800 transition-all cursor-pointer"
                title="เปลี่ยนรูปประจำตัว"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Core Info */}
            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900">
                  {currentUser?.employeeId || "EMP-2569-001"}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {currentUser?.roleTitle || "บุคลากร"}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  currentUser?.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {currentUser?.status === "active" ? "สถานะใช้งานปกติ" : "รออนุมัติ"}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                {currentUser?.name || "ผู้ใช้งานระบบ"}
              </h2>

              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser?.department || "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์"}</span>
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>อัปโหลดรูปภาพใหม่</span>
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ใช้รูปตัวอักษรย่อ</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Official Read-only Attributes */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 font-medium">รหัสบุคลากรถาวร (Employee ID)</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{currentUser?.employeeId || "EMP-2569-001"}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 font-medium">ตำแหน่งทางการ</span>
              <p className="font-bold text-slate-900 mt-0.5">{currentUser?.position || "เจ้าหน้าที่บริหารงานทั่วไป"}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 font-medium">อีเมลทางการของมหาวิทยาลัย</span>
              <p className="font-mono font-semibold text-slate-900 mt-0.5 truncate">{currentUser?.email}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 font-medium">ผู้บังคับบัญชา / หัวหน้างาน</span>
              <p className="font-bold text-slate-900 mt-0.5">{currentUser?.supervisorName || "ผศ.ดร.สานนท์ ด่านภักดี (คณบดี)"}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 font-medium">การลงเวลาทำงาน</span>
              <p className="font-bold text-slate-900 mt-0.5">
                {currentUser?.attendanceEligible !== false ? "ต้องลงเวลาทำงาน (วันทำการปกติ)" : "ได้รับยกเว้นการลงเวลา"}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 font-medium">วันที่สร้างบัญชี</span>
              <p className="font-semibold text-slate-700 mt-0.5">
                {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString("th-TH") : "28 ก.ย. 2569"}
              </p>
            </div>
          </div>
        </div>

        {/* Editable Contact & Bio Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-card space-y-4">
          <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-900" />
            <span>ข้อมูลติดต่อและข้อมูลทั่วไปที่แก้ไขได้</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                เบอร์โทรศัพท์ติดต่อภายใน / มือถือ
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="เช่น 081-234-5678 หรือ ต่อ 4201"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-blue-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ห้องทำงาน / โต๊ะทำงาน
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="เช่น ห้องพักอาจารย์ ชั้น 3 อาคาร 4"
                  value={officeRoom}
                  onChange={(e) => setOfficeRoom(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-blue-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำอธิบายภาระหน้าที่ / หมายเหตุเพิ่มเติม (Bio)
            </label>
            <textarea
              rows={3}
              placeholder="ระบุภารกิจงานที่รับผิดชอบหลัก หรือเวลาติดต่อ..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:border-blue-900 focus:outline-none text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
