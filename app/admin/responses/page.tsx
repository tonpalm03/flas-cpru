"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileCheck, Download, Printer, Plus, Sparkles, ArrowLeft } from "lucide-react";
import { printDocumentView, exportMemoToWord } from "@/lib/documentGenerator";

const RESPONSE_TEMPLATES = {
  speaker: {
    title: "แบบตอบรับการเป็นวิทยากร",
    subject: "ตอบรับการเป็นวิทยากรโครงการพัฒนาศักยภาพนักศึกษา",
    body: "ข้าพเจ้ามีความยินดีตอบรับเป็นวิทยากรบรรยายตามวัน เวลา และสถานที่ที่กำหนด",
    feeOption: "ขอรับค่าตอบแทนวิทยากรตามระเบียบของทางราชการ"
  },
  activity: {
    title: "แบบตอบรับการเข้าร่วมกิจกรรม / การอบรม",
    subject: "ตอบรับการส่งตัวแทนเข้าร่วมโครงการอบรมเชิงปฏิบัติการ",
    body: "หน่วยงานมีความยินดีส่งตัวแทนและบุคลากรเข้าร่วมกิจกรรมตามกำหนดการ",
    feeOption: "จำนวนผู้เข้าร่วมทั้งสิ้น 5 คน"
  },
  facility: {
    title: "แบบตอบรับการขอใช้สถานที่และบริการชุมชน",
    subject: "ยินยอมให้ใช้สถานที่จัดกิจกรรมบริการวิชาการแก่ชุมชน",
    body: "ผู้นำชุมชนและคณะกรรมการยินดีอนุญาตให้ใช้สถานที่ศาลาประชาคมเพื่อดำเนินโครงการ",
    feeOption: "พร้อมจัดเตรียมสิ่งอำนวยความสะดวกในพื้นที่"
  }
};

export default function ResponsesGeneratorPage() {
  const [templateKey, setTemplateKey] = useState<keyof typeof RESPONSE_TEMPLATES>("speaker");
  const [responderName, setResponderName] = useState("นายธีรเดช วิทยากรเกียรติคุณ");
  const [responderPosition, setResponderPosition] = useState("ผู้เชี่ยวชาญด้านปัญญาประดิษฐ์และนโยบายดิจิทัล");
  const [organization, setOrganization] = useState("สำนักงานพัฒนาเทคโนโลยีดิจิทัล");
  const [telephone, setTelephone] = useState("089-123-xxxx");
  const [projectName, setProjectName] = useState("โครงการ AI Coding เบื้องต้นและการวิเคราะห์เชิงนโยบาย");
  const [dateFormatted, setDateFormatted] = useState("15 ตุลาคม 2569 เวลา 09.00 - 16.30 น.");
  const [location, setLocation] = useState("ห้อง Smart Classroom 421 คณะศิลปศาสตร์และวิทยาศาสตร์");

  const current = RESPONSE_TEMPLATES[templateKey];

  const handleExportWord = async () => {
    await exportMemoToWord({
      department: organization,
      docNumber: "ตบ 01/2569",
      date: new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }),
      to: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ",
      subject: current.subject,
      paragraphs: [
        `ตามที่ คณะศิลปศาสตร์และวิทยาศาสตร์ ได้มีหนังสือเชิญเข้าร่วม ${projectName} ในวันที่ ${dateFormatted} ณ ${location} นั้น`,
        `ข้าพเจ้า ${responderName} ตำแหน่ง ${responderPosition} สังกัด ${organization} ขอแจ้งผลการพิจารณาว่า: มีความยินดีตอบรับเข้าร่วมกิจกรรมดังกล่าว โดย${current.feeOption}`,
        `จึงเรียนมาเพื่อโปรดทราบและประสานงานต่อไป`
      ],
      signatoryName: responderName,
      signatoryPosition: responderPosition,
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-xs text-blue-800 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปศูนย์ธุรการ
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            ระบบสร้างแบบตอบรับ (Response Form Generator)
          </h1>
          <p className="text-xs text-slate-500">
            สร้างแบบตอบรับวิทยากร ตอบรับเข้าร่วมกิจกรรม และตอบรับการขอใช้สถานที่ชุมชน (ส่งออก Word & PDF)
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
            <span>ส่งออก Word (.docx)</span>
          </button>
        </div>
      </div>

      {/* Template Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-subtle flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-900" /> เลือกประเภทแบบตอบรับ:
        </span>
        <button
          type="button"
          onClick={() => setTemplateKey("speaker")}
          className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            templateKey === "speaker" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          001 แบบตอบรับวิทยากร
        </button>
        <button
          type="button"
          onClick={() => setTemplateKey("activity")}
          className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            templateKey === "activity" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          002 แบบตอบรับเข้าร่วมกิจกรรม
        </button>
        <button
          type="button"
          onClick={() => setTemplateKey("facility")}
          className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            templateKey === "facility" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          003 แบบตอบรับชุมชน / ใช้สถานที่
        </button>
      </div>

      {/* Main Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-card space-y-4 text-xs text-slate-800">
        <h2 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
          ข้อมูลแบบตอบรับ: {current.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">ชื่อ-สกุล ผู้ตอบรับ</label>
            <input
              type="text"
              value={responderName}
              onChange={(e) => setResponderName(e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
            <input
              type="text"
              value={responderPosition}
              onChange={(e) => setResponderPosition(e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">หน่วยงาน / สังกัด</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
            <input
              type="text"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">ชื่อโครงการที่เกี่ยวข้อง</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">วันและเวลาที่จัดกิจกรรม</label>
            <input
              type="text"
              value={dateFormatted}
              onChange={(e) => setDateFormatted(e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">สถานที่จัดกิจกรรม</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border rounded-lg p-2.5"
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
