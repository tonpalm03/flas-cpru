"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, Download, Printer, Plus, Sparkles, ArrowLeft, GraduationCap, Award } from "lucide-react";
import { exportMemoToWord, printDocumentView } from "@/lib/documentGenerator";

export default function TeacherPortfolioPage() {
  const [teacherName, setTeacherName] = useState("อาจารย์ฤทธิชัย ภาระวิเศษ");
  const [position, setPosition] = useState("อาจารย์ประจำสาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์");
  const [degree, setDegree] = useState("รัฐศาสตรมหาบัณฑิต (ร.ม.) จุฬาลงกรณ์มหาวิทยาลัย");
  const [contractType, setContractType] = useState("พนักงานจ้างตามภารกิจ (ประเภทวิชาการ)");
  const [teachingLoad, setTeachingLoad] = useState("18 คาบ/สัปดาห์ (ภาคปกติ และ กศ.ปช.)");
  const [researchPapers, setResearchPapers] = useState("1. การพัฒนานโยบายสาธารณะแบบมีส่วนร่วมในจังหวัดชัยภูมิ (2568)\n2. การประยุกต์ใช้ AI ในการบริการภาครัฐสู่การเป็นพลเมืองดิจิทัล (2569)");
  const [academicServices, setAcademicServices] = useState("วิทยากรโครงการพัฒนาศักยภาพผู้นำชุมชน อ.เนินสง่า และโครงการศาสตร์พระราชา");

  const handleExportWord = async () => {
    await exportMemoToWord({
      department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์ คณะศิลปศาสตร์และวิทยาศาสตร์",
      docNumber: "ประวัติ-01/2569",
      date: new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }),
      to: "คณะกรรมการประเมินผลการปฏิบัติงาน คณะศิลปศาสตร์และวิทยาศาสตร์",
      subject: `แฟ้มประวัติและผลงานทางวิชาการ (SAR) - ${teacherName}`,
      paragraphs: [
        `ประวัติส่วนบุคคล: ${teacherName} ตำแหน่ง ${position} วุฒิการศึกษาสูงสุด: ${degree} ประเภทสัญญาจ้าง: ${contractType}`,
        `ภาระงานสอนประจำปีการศึกษา 2569: ${teachingLoad}`,
        `ผลงานวิจัยและบทความทางวิชาการที่ตีพิมพ์:\n${researchPapers}`,
        `งานบริการวิชาการแก่สังคมและชุมชน:\n${academicServices}`,
        `ขอรับรองว่าข้อมูลข้างต้นเป็นความจริงทุกประการ`
      ],
      signatoryName: teacherName,
      signatoryPosition: position,
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/hr" className="text-xs text-blue-800 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปหน้ารวมบุคคล
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            แฟ้มประวัติและผลงานทางวิชาการ (Faculty Staff Portfolio / SAR)
          </h1>
          <p className="text-xs text-slate-500">
            บันทึกประวัติอาจารย์ ภาระงานสอน ผลงานวิจัย สัญญาจ้าง และส่งออกเอกสาร Word (.docx)
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
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Word แฟ้มประวัติ</span>
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-card space-y-4 text-xs text-slate-800">
        <h2 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
          ข้อมูลประวัติและผลงาน (อ้างอิงไฟล์ ประวัติและผลงาน_ฤทธิชัย_V5-2.doc)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">ชื่อ - สกุล อาจารย์</label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full border rounded-lg p-2.5 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ตำแหน่งทางวิชาการ / สาขา</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">วุฒิการศึกษา</label>
            <input
              type="text"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ประเภทสัญญาปฏิบัติงาน</label>
            <input
              type="text"
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">ภาระงานสอนประจำภาคเรียน</label>
            <input
              type="text"
              value={teachingLoad}
              onChange={(e) => setTeachingLoad(e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">ผลงานวิจัย / บทความวิชาการ</label>
            <textarea
              rows={3}
              value={researchPapers}
              onChange={(e) => setResearchPapers(e.target.value)}
              className="w-full border rounded-lg p-2.5 resize-none leading-relaxed"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">ผลงานบริการวิชาการและโครงการที่รับผิดชอบ</label>
            <textarea
              rows={2}
              value={academicServices}
              onChange={(e) => setAcademicServices(e.target.value)}
              className="w-full border rounded-lg p-2.5 resize-none leading-relaxed"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleExportWord}
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>สร้างและส่งออก Word (.docx)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
