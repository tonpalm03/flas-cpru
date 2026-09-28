"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Settings, Save, RotateCcw, CheckCircle2, FileText, Building2, User, Sparkles } from "lucide-react";
import { getSystemTemplates, saveSystemTemplates, DEFAULT_TEMPLATES_CONFIG, SystemTemplatesConfig } from "@/lib/templateConfig";

export default function AdminTemplatesEditorPage() {
  const [config, setConfig] = useState<SystemTemplatesConfig>(DEFAULT_TEMPLATES_CONFIG);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setConfig(getSystemTemplates());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSystemTemplates(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm("คุณต้องการรีเซ็ตแม่แบบเอกสารกลับเป็นค่าเริ่มต้นใช่หรือไม่?")) {
      setConfig(DEFAULT_TEMPLATES_CONFIG);
      saveSystemTemplates(DEFAULT_TEMPLATES_CONFIG);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-xs text-blue-800 hover:underline">
            ← กลับไปศูนย์ธุรการ
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            จัดการแม่แบบเอกสารราชการ (Document Template Customizer)
          </h1>
          <p className="text-xs text-slate-500">
            แอดมินสามารถกำหนดหัวกระดาษ เลขที่หนังสือ ผู้ลงนาม และย่อหน้ามาตรฐานที่ระบบจะนำไป Process ออกเป็น Word/PDF
          </p>
        </div>

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
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกแม่แบบทั้งหมด</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>บันทึกการตั้งค่าแม่แบบเอกสารสำเร็จ ระบบจะนำค่าใหม่ไปใช้สร้างไฟล์ Word, Excel และ PDF ทันที</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-800">
        {/* Section 1: Organization & Default Signatory */}
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
                value={config.facultyName}
                onChange={(e) => setConfig({ ...config, facultyName: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อมหาวิทยาลัย</label>
              <input
                type="text"
                value={config.universityName}
                onChange={(e) => setConfig({ ...config, universityName: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อส่วนราชการ / สำนักงานเริ่มต้น</label>
              <input
                type="text"
                value={config.officeName}
                onChange={(e) => setConfig({ ...config, officeName: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">หมายเลขโทรศัพท์ติดต่อ</label>
              <input
                type="text"
                value={config.telephone}
                onChange={(e) => setConfig({ ...config, telephone: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อ-สกุล คณบดีผู้ลงนาม (พร้อมคำนำหน้า)</label>
              <input
                type="text"
                value={config.deanName}
                onChange={(e) => setConfig({ ...config, deanName: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ตำแหน่งผู้ลงนาม</label>
              <input
                type="text"
                value={config.deanPosition}
                onChange={(e) => setConfig({ ...config, deanPosition: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Numbers & Defaults */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-sm text-slate-900">
            <Settings className="w-4 h-4 text-blue-900" />
            <span>2. ค่าตั้งต้นเลขที่หนังสือและปีงบประมาณ (System Defaults)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">รหัสเลขที่หนังสือส่ง (Prefix)</label>
              <input
                type="text"
                value={config.defaultDocPrefix}
                onChange={(e) => setConfig({ ...config, defaultDocPrefix: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ปีงบประมาณปัจจุบัน (พ.ศ.)</label>
              <input
                type="number"
                value={config.defaultFiscalYear}
                onChange={(e) => setConfig({ ...config, defaultFiscalYear: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-blue-900 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">อัตราภาษีมูลค่าเพิ่มพัสดุ (VAT %)</label>
              <input
                type="number"
                value={config.vatRate}
                onChange={(e) => setConfig({ ...config, vatRate: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-slate-900 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Standard Memo Phrases */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-sm text-slate-900">
            <FileText className="w-4 h-4 text-blue-900" />
            <span>3. ย่อหน้าข้อความมาตรฐานในบันทึกข้อความ (Standard Phrasings)</span>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="block font-bold text-blue-900">
                แม่แบบที่ 1: หนังสือเชิญวิทยากร
              </label>
              <input
                type="text"
                placeholder="ย่อหน้าเกริ่นนำ"
                value={config.memoStandardParagraphs.speakerInviteIntro}
                onChange={(e) => setConfig({
                  ...config,
                  memoStandardParagraphs: { ...config.memoStandardParagraphs, speakerInviteIntro: e.target.value }
                })}
                className="w-full border border-slate-200 rounded-lg p-2 bg-white"
              />
              <textarea
                rows={2}
                placeholder="ย่อหน้าเนื้อหา"
                value={config.memoStandardParagraphs.speakerInviteBody}
                onChange={(e) => setConfig({
                  ...config,
                  memoStandardParagraphs: { ...config.memoStandardParagraphs, speakerInviteBody: e.target.value }
                })}
                className="w-full border border-slate-200 rounded-lg p-2 bg-white resize-none"
              />
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="block font-bold text-blue-900">
                แม่แบบที่ 2: ขอความอนุเคราะห์เวลาเรียนของนักศึกษา
              </label>
              <input
                type="text"
                placeholder="ย่อหน้าเกริ่นนำ"
                value={config.memoStandardParagraphs.classExemptionIntro}
                onChange={(e) => setConfig({
                  ...config,
                  memoStandardParagraphs: { ...config.memoStandardParagraphs, classExemptionIntro: e.target.value }
                })}
                className="w-full border border-slate-200 rounded-lg p-2 bg-white"
              />
              <textarea
                rows={2}
                placeholder="ย่อหน้าเนื้อหา"
                value={config.memoStandardParagraphs.classExemptionBody}
                onChange={(e) => setConfig({
                  ...config,
                  memoStandardParagraphs: { ...config.memoStandardParagraphs, classExemptionBody: e.target.value }
                })}
                className="w-full border border-slate-200 rounded-lg p-2 bg-white resize-none"
              />
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="block font-bold text-blue-900">
                แม่แบบที่ 3: ขออนุมัติเดินทางไปปฏิบัติราชการ
              </label>
              <input
                type="text"
                placeholder="ย่อหน้าเกริ่นนำ"
                value={config.memoStandardParagraphs.travelDutyIntro}
                onChange={(e) => setConfig({
                  ...config,
                  memoStandardParagraphs: { ...config.memoStandardParagraphs, travelDutyIntro: e.target.value }
                })}
                className="w-full border border-slate-200 rounded-lg p-2 bg-white"
              />
              <textarea
                rows={2}
                placeholder="ย่อหน้าเนื้อหา"
                value={config.memoStandardParagraphs.travelDutyBody}
                onChange={(e) => setConfig({
                  ...config,
                  memoStandardParagraphs: { ...config.memoStandardParagraphs, travelDutyBody: e.target.value }
                })}
                className="w-full border border-slate-200 rounded-lg p-2 bg-white resize-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ย่อหน้าคำลงท้ายมาตรฐาน</label>
              <input
                type="text"
                value={config.memoStandardParagraphs.closingStandard}
                onChange={(e) => setConfig({
                  ...config,
                  memoStandardParagraphs: { ...config.memoStandardParagraphs, closingStandard: e.target.value }
                })}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 text-xs"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการตั้งค่าแม่แบบเอกสาร</span>
          </button>
        </div>
      </form>
    </div>
  );
}
