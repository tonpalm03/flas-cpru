"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FolderKanban, Download, Printer, Plus, Trash2, CheckCircle2, ArrowLeft } from "lucide-react";
import { exportProjectToWord, printDocumentView } from "@/lib/documentGenerator";

export default function NewProjectProposalPage() {
  const [formData, setFormData] = useState({
    title: "โครงการพัฒนาทักษะวิชาชีพและการประยุกต์ใช้ AI เพื่อการตัดสินใจเชิงนโยบาย",
    strategicGoal: "ประเด็นยุทธศาสตร์ที่ 3 : ยกระดับคุณภาพการศึกษาและการเรียนรู้ตลอดชีวิต",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    leader: "อ.ฤทธิชัย ภาระวิเศษ",
    fiscalYear: 2569,
    budgetApproved: 85000,
    kpis: [
      "นักศึกษาที่เข้าร่วมโครงการมีความรู้ความเข้าใจเกี่ยวกับ AI เพิ่มขึ้นไม่น้อยกว่าร้อยละ 80",
      "มีผลงานชิ้นงาน/นโยบายจำลองที่ประยุกต์ใช้ AI ไม่น้อยกว่า 5 ชิ้นงาน"
    ],
    rationale: "ในปัจจุบันเทคโนโลยีปัญญาประดิษฐ์ (AI) เข้ามามีบทบาทสำคัญในการบริหารงานภาครัฐและการตัดสินใจเชิงนโยบาย คณะจึงเห็นควรจัดโครงการนี้เพื่อเตรียมความพร้อมนักศึกษา",
    targetGroup: "นักศึกษาชั้นปีที่ 3-4 สาขาวิชารัฐศาสตร์ จำนวน 50 คน",
    location: "ห้อง Smart Classroom 421 อาคาร 4 คณะศิลปศาสตร์และวิทยาศาสตร์",
    startDate: "2026-11-15",
    endDate: "2026-11-16"
  });

  const [newKpi, setNewKpi] = useState("");

  const handleAddKpi = () => {
    if (newKpi.trim()) {
      setFormData({
        ...formData,
        kpis: [...formData.kpis, newKpi.trim()]
      });
      setNewKpi("");
    }
  };

  const handleRemoveKpi = (index: number) => {
    setFormData({
      ...formData,
      kpis: formData.kpis.filter((_, i) => i !== index)
    });
  };

  const handleExport = async () => {
    await exportProjectToWord(formData);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/projects" className="text-xs text-blue-800 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปหน้ารายการโครงการ
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            เขียนแบบเสนอโครงการประจำปีงบประมาณ พ.ศ. 2569
          </h1>
          <p className="text-xs text-slate-500">
            กรอกรายละเอียดโครงการตามแบบฟอร์ม มรภ.ชัยภูมิ และส่งออกเป็น Word (.docx) หรือ PDF
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={printDocumentView}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Word (.docx)</span>
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-card space-y-6 text-xs text-slate-800">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">
            ข้อมูลทั่วไปของโครงการ (Project Overview)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">1. ชื่อโครงการ</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 font-medium focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">2. ประเด็นยุทธศาสตร์</label>
            <select
              value={formData.strategicGoal}
              onChange={(e) => setFormData({ ...formData, strategicGoal: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
            >
              <option value="โครงการตามยุทธศาสตร์เพื่อการพัฒนาท้องถิ่น (ศาสตร์พระราชา)">
                โครงการตามยุทธศาสตร์เพื่อการพัฒนาท้องถิ่น (ศาสตร์พระราชา)
              </option>
              <option value="ประเด็นยุทธศาสตร์ที่ 1 : การพัฒนาท้องถิ่นและชุมชนเข้มแข็ง">
                ประเด็นยุทธศาสตร์ที่ 1 : การพัฒนาท้องถิ่นและชุมชนเข้มแข็ง
              </option>
              <option value="ประเด็นยุทธศาสตร์ที่ 2 : การผลิตและพัฒนาครูและบุคลากรทางการศึกษา">
                ประเด็นยุทธศาสตร์ที่ 2 : การผลิตและพัฒนาครูและบุคลากรทางการศึกษา
              </option>
              <option value="ประเด็นยุทธศาสตร์ที่ 3 : ยกระดับคุณภาพการศึกษาและการเรียนรู้ตลอดชีวิต">
                ประเด็นยุทธศาสตร์ที่ 3 : ยกระดับคุณภาพการศึกษาและการเรียนรู้ตลอดชีวิต
              </option>
              <option value="ประเด็นยุทธศาสตร์ที่ 4 : การพัฒนาระบบบริหารจัดการองค์กรสู่ความทันสมัย">
                ประเด็นยุทธศาสตร์ที่ 4 : การพัฒนาระบบบริหารจัดการองค์กรสู่ความทันสมัย
              </option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">3. สาขาวิชา / หน่วยงานรับผิดชอบ</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">4. ผู้รับผิดชอบโครงการ (หัวหน้าโครงการ)</label>
            <input
              type="text"
              value={formData.leader}
              onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">5. งบประมาณที่เสนอขอ (บาท)</label>
            <input
              type="number"
              value={formData.budgetApproved}
              onChange={(e) => setFormData({ ...formData, budgetApproved: Number(e.target.value) })}
              className="w-full border border-slate-200 rounded-lg p-2.5 font-bold text-blue-900 focus:border-blue-900 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">6. หลักการและเหตุผล</label>
          <textarea
            rows={3}
            value={formData.rationale}
            onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
            className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* KPIs Section */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            7. ตัวชี้วัดความสำเร็จ (Key Performance Indicators)
          </label>
          <div className="space-y-2 mb-3">
            {formData.kpis.map((kpi, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-medium">{idx + 1}. {kpi}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveKpi(idx)}
                  className="text-slate-400 hover:text-rose-600 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="เพิ่มตัวชี้วัดความสำเร็จ..."
              value={newKpi}
              onChange={(e) => setNewKpi(e.target.value)}
              className="flex-1 border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKpi())}
            />
            <button
              type="button"
              onClick={handleAddKpi}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
            >
              เพิ่ม KPI
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Link
            href="/projects"
            className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium"
          >
            ยกเลิก
          </Link>
          <button
            type="button"
            onClick={handleExport}
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>บันทึกและส่งออก Word (.docx)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
