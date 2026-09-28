"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Settings, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  FileText, 
  Building2, 
  User, 
  Sparkles,
  ShieldAlert,
  Clock,
  ArrowLeft
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { 
  DEFAULT_TEMPLATES_CONFIG, 
  SystemTemplatesConfig, 
  fetchSystemTemplatesConfig, 
  saveSystemTemplates 
} from "@/lib/templateConfig";

export default function AdminTemplatesEditorPage() {
  const { currentUser, isAdmin } = useRole();
  const [config, setConfig] = useState<SystemTemplatesConfig>(DEFAULT_TEMPLATES_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const data = await fetchSystemTemplatesConfig();
        setConfig(data);
      } catch (err) {
        console.warn("Load template config error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("ท่านไม่มีสิทธิ์แก้ไขการตั้งค่าแม่แบบส่วนกลาง (สิทธิ์เฉพาะผู้ดูแลระบบสารบรรณ)");
      return;
    }

    try {
      setSaving(true);
      await saveSystemTemplates(config, currentUser);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการบันทึกแม่แบบ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!isAdmin) return;
    if (confirm("คุณต้องการรีเซ็ตแม่แบบเอกสารกลับเป็นค่ามาตรฐานของคณะใช่หรือไม่?")) {
      setConfig(DEFAULT_TEMPLATES_CONFIG);
      await saveSystemTemplates(DEFAULT_TEMPLATES_CONFIG, currentUser);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-xs text-blue-900 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปศูนย์ธุรการ
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            จัดการแม่แบบเอกสารส่วนกลาง (Master Template Customizer)
          </h1>
          <p className="text-xs text-slate-500">
            กำหนดหัวกระดาษ เลขที่หนังสือ ผู้ลงนาม (คณบดี) และย่อหน้ามาตรฐานที่ระบบจะนำไปสร้างไฟล์ Word, Excel และ PDF
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>รีเซ็ตค่าเริ่มต้น</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "กำลังบันทึก..." : "บันทึกแม่แบบส่วนกลาง"}</span>
            </button>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <div>
            <p className="font-bold">โหมดอ่านอย่างเดียว (Read-Only Mode)</p>
            <p className="text-amber-800 mt-0.5">
              คุณกำลังดูการตั้งค่าแม่แบบส่วนกลางของคณะ เฉพาะบัญชีผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถบันทึกการเปลี่ยนแปลงได้
            </p>
          </div>
        </div>
      )}

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>บันทึกการตั้งค่าแม่แบบลงฐานข้อมูล Firestore สำเร็จ ระบบจะนำค่าใหม่ไปใช้สร้างไฟล์เอกสารทั้งหมดทันที</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
          <Clock className="w-6 h-6 animate-spin text-blue-900" />
          <span>กำลังโหลดการตั้งค่าแม่แบบส่วนกลาง...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-800">
          {/* Section 1: Organization & Signatory */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-sm text-slate-900">
              <Building2 className="w-4 h-4 text-blue-900" />
              <span>1. ข้อมูลหน่วยงานและผู้ลงนามหลัก (Organization & Signatory)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อคณะ</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={config.facultyName}
                  onChange={(e) => setConfig({ ...config, facultyName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อมหาวิทยาลัย</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={config.universityName}
                  onChange={(e) => setConfig({ ...config, universityName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อผู้ลงนามหลัก (คณบดี)</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={config.deanName}
                  onChange={(e) => setConfig({ ...config, deanName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ตำแหน่งทางการของผู้ลงนาม</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={config.deanPosition}
                  onChange={(e) => setConfig({ ...config, deanPosition: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Document Numbering & Rates */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-sm text-slate-900">
              <FileText className="w-4 h-4 text-blue-900" />
              <span>2. รหัสหนังสือราชการและพารามิเตอร์ระบบ (Numbering & Rates)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">รหัสพรีฟิกซ์หนังสือส่งของคณะ</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={config.defaultDocPrefix}
                  onChange={(e) => setConfig({ ...config, defaultDocPrefix: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none font-mono disabled:bg-slate-50"
                />
                <span className="text-[10px] text-slate-400">เช่น อว 0643.04/</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ปีงบประมาณเริ่มต้น</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={config.defaultFiscalYear}
                  onChange={(e) => setConfig({ ...config, defaultFiscalYear: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">อัตราภาษีมูลค่าเพิ่ม VAT (%)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={config.vatRate}
                  onChange={(e) => setConfig({ ...config, vatRate: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Standard Memo Paragraphs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-sm text-slate-900">
              <Sparkles className="w-4 h-4 text-blue-900" />
              <span>3. ย่อหน้าข้อความมาตรฐานในบันทึกข้อความราชการ</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">หนังสือเชิญวิทยากร (ย่อหน้าเปิดเรื่อง)</label>
                <textarea
                  rows={2}
                  disabled={!isAdmin}
                  value={config.memoStandardParagraphs.speakerInviteIntro}
                  onChange={(e) => setConfig({
                    ...config,
                    memoStandardParagraphs: { ...config.memoStandardParagraphs, speakerInviteIntro: e.target.value }
                  })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ขอเวลาเรียนนักศึกษา (ย่อหน้าเปิดเรื่อง)</label>
                <textarea
                  rows={2}
                  disabled={!isAdmin}
                  value={config.memoStandardParagraphs.classExemptionIntro}
                  onChange={(e) => setConfig({
                    ...config,
                    memoStandardParagraphs: { ...config.memoStandardParagraphs, classExemptionIntro: e.target.value }
                  })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ข้อความลงท้ายมาตรฐาน (ทุกประเภท)</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={config.memoStandardParagraphs.closingStandard}
                  onChange={(e) => setConfig({
                    ...config,
                    memoStandardParagraphs: { ...config.memoStandardParagraphs, closingStandard: e.target.value }
                  })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
