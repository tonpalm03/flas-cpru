"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  FileEdit, 
  Download, 
  Printer, 
  Sparkles, 
  FileText, 
  Copy, 
  Check,
  RefreshCw,
  Eye,
  Settings,
  HelpCircle
} from "lucide-react";
import { exportMemoToWord, printDocumentView } from "@/lib/documentGenerator";

const TEMPLATES = {
  speaker_invite: {
    name: "หนังสือเชิญวิทยากร (ภายใน)",
    department: "สาขาวิชารัฐศาสตร์ คณะศิลปศาสตร์และวิทยาศาสตร์ โทร. 044-811-xxx",
    subject: "ขอเรียนเชิญเป็นวิทยากรโครงการพัฒนาศักยภาพนักศึกษา",
    to: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์ / อาจารย์ประจำสาขาวิชา",
    paragraphs: [
      "ด้วย สาขาวิชารัฐศาสตร์ คณะศิลปศาสตร์และวิทยาศาสตร์ มีกำหนดจัดโครงการพัฒนาศักยภาพและเสริมสร้างประสบการณ์เรียนรู้เชิงนวัตกรรม ในวันที่ 15 ตุลาคม 2569 เวลา 09.00 - 16.30 น. ณ ห้องประชุมสิริวิชาญ",
      "ในการนี้ สาขาวิชารัฐศาสตร์ พิจารณาเห็นว่าท่านเป็นผู้มีความรู้ ความสามารถ และประสบการณ์ในหัวข้อดังกล่าว จึงใคร่ขอเรียนเชิญท่านเป็นวิทยากรบรรยายตามวัน เวลา และสถานที่ดังกล่าวข้างต้น",
      "จึงเรียนมาเพื่อโปรดพิจารณาและให้ความอนุเคราะห์"
    ],
    signatoryName: "อาจารย์ฤทธิชัย ภาระวิเศษ",
    signatoryPosition: "หัวหน้าโครงการ / อาจารย์ประจำสาขาวิชา"
  },
  class_exemption: {
    name: "ขอความอนุเคราะห์เวลาเรียน (นักศึกษาเข้าร่วมโครงการ)",
    department: "งานบริการการศึกษา คณะศิลปศาสตร์และวิทยาศาสตร์ โทร. 044-811-xxx",
    subject: "ขอความอนุเคราะห์เวลาเรียนของนักศึกษาเข้าร่วมโครงการ",
    to: "อาจารย์ผู้สอนทุกท่าน",
    paragraphs: [
      "ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ ได้จัดโครงการอบรมเชิงปฏิบัติการ Startup Creator สร้างนวัตกรท่องเที่ยวรุ่นใหม่ ในวันพุธที่ 8 ตุลาคม 2569 เวลา 08.30 - 16.30 น. ณ อาคาร 4 ห้อง 421",
      "เพื่อให้การดำเนินโครงการบรรลุตามวัตถุประสงค์ จึงใคร่ขอความอนุเคราะห์เวลาเรียนของนักศึกษาชั้นปีที่ 3 และ 4 สาขาวิชาบริหารธุรกิจ จำนวน 45 คน ตามรายชื่อแนบท้าย เพื่อเข้าร่วมกิจกรรมดังกล่าว",
      "จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์"
    ],
    signatoryName: "ผู้ช่วยศาสตราจารย์ ดร.นฤมล อนันตโชค",
    signatoryPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์"
  },
  travel_duty: {
    name: "บันทึกขออนุมัติเดินทางไปปฏิบัติราชการ",
    department: "สาขาวิชาวิศวกรรมการผลิต คณะศิลปศาสตร์และวิทยาศาสตร์",
    subject: "ขออนุมัติเดินทางไปปฏิบัติราชการและขอใช้ยานพาหนะ",
    to: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    paragraphs: [
      "ด้วย ข้าพเจ้าและคณะรวม 3 คน มีความจำเป็นต้องเดินทางไปดำเนินงานโครงการยกระดับเศรษฐกิจฐานราก ณ ชุมชนบ้านเสี้ยวน้อย ตำบลท่าหินโงม อำเภอเมือง จังหวัดชัยภูมิ ในวันที่ 20 ตุลาคม 2569",
      "ในการนี้ จึงขออนุมัติเดินทางไปปฏิบัติราชการ พร้อมขออนุมัติใช้รถยนต์ส่วนกลางของคณะ หมายเลขทะเบียน นข 1234 ชัยภูมิ และขออนุมัติเบิกจ่ายค่าใช้จ่ายในการเดินทางตามระเบียบของทางราชการ",
      "จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ"
    ],
    signatoryName: "ดร.สุรชัย นวัตกร",
    signatoryPosition: "อาจารย์ประจำสาขาวิชา / หัวหน้าโครงการ"
  }
};

export default function MemoGeneratorPage() {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<keyof typeof TEMPLATES>("speaker_invite");
  
  const [department, setDepartment] = useState(TEMPLATES.speaker_invite.department);
  const [docNumber, setDocNumber] = useState("อว 0604.05/ว 048");
  const [date, setDate] = useState("28 กันยายน 2569");
  const [subject, setSubject] = useState(TEMPLATES.speaker_invite.subject);
  const [to, setTo] = useState(TEMPLATES.speaker_invite.to);
  const [p1, setP1] = useState(TEMPLATES.speaker_invite.paragraphs[0]);
  const [p2, setP2] = useState(TEMPLATES.speaker_invite.paragraphs[1]);
  const [p3, setP3] = useState(TEMPLATES.speaker_invite.paragraphs[2]);
  const [signatoryName, setSignatoryName] = useState(TEMPLATES.speaker_invite.signatoryName);
  const [signatoryPosition, setSignatoryPosition] = useState(TEMPLATES.speaker_invite.signatoryPosition);
  
  const [copied, setCopied] = useState(false);

  const applyTemplate = (key: keyof typeof TEMPLATES) => {
    setSelectedTemplateKey(key);
    const tmpl = TEMPLATES[key];
    setDepartment(tmpl.department);
    setSubject(tmpl.subject);
    setTo(tmpl.to);
    setP1(tmpl.paragraphs[0] || "");
    setP2(tmpl.paragraphs[1] || "");
    setP3(tmpl.paragraphs[2] || "");
    setSignatoryName(tmpl.signatoryName);
    setSignatoryPosition(tmpl.signatoryPosition);
  };

  const handleExportWord = async () => {
    await exportMemoToWord({
      department,
      docNumber,
      date,
      to,
      subject,
      paragraphs: [p1, p2, p3].filter(Boolean),
      signatoryName,
      signatoryPosition,
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-xs text-blue-800 hover:underline">
              ← กลับไปศูนย์ธุรการ
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            สร้างบันทึกข้อความราชการ (Official Memo Generator)
          </h1>
          <p className="text-xs text-slate-500">
            กรอกข้อมูลในระบบ แสดงตัวอย่างแบบฟอร์มราชการตราครุฑ และส่งออกเป็น Word (.docx) หรือ PDF
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={printDocumentView}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ / บันทึก PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Word (.docx)</span>
          </button>
        </div>
      </div>

      {/* Template Selector Pills */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-subtle flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-800" /> แม่แบบบันทึกข้อความ:
        </span>
        {(Object.keys(TEMPLATES) as Array<keyof typeof TEMPLATES>).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => applyTemplate(key)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedTemplateKey === key
                ? "bg-blue-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {TEMPLATES[key].name}
          </button>
        ))}
      </div>

      {/* Main Grid: Form Left, Realtime Document Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 5 cols */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-card space-y-4 text-xs">
          <h2 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>แบบฟอร์มกรอกข้อมูล</span>
            <span className="text-[10px] text-blue-800 font-normal">แก้ไขเพื่อเปลี่ยนพรีวิวสด</span>
          </h2>

          <div>
            <label className="block font-medium text-slate-700 mb-1">ส่วนราชการ (หน่วยงาน/โทรศัพท์)</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">ที่ (เลขที่หนังสือ)</label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:border-blue-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">วันที่</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">เรื่อง</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">เรียน</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">ข้อความ (ย่อหน้าเกริ่นนำ)</label>
            <textarea
              rows={3}
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">ข้อความ (ย่อหน้าเนื้อหา/จุดประสงค์)</label>
            <textarea
              rows={3}
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">ข้อความ (ย่อหน้าสรุป)</label>
            <input
              type="text"
              value={p3}
              onChange={(e) => setP3(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-medium text-slate-700 mb-1">ชื่อผู้ลงนาม</label>
              <input
                type="text"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">ตำแหน่ง</label>
              <input
                type="text"
                value={signatoryPosition}
                onChange={(e) => setSignatoryPosition(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Preview (Official Thai Memo Sheet A4 Style): 7 cols */}
        <div className="lg:col-span-7 bg-white border border-slate-300 rounded-2xl p-8 md:p-12 shadow-float text-slate-900 doc-sarabun text-sm relative">
          <div className="absolute top-4 right-4 no-print flex items-center gap-1 text-slate-400 text-xs">
            <Eye className="w-3.5 h-3.5" /> พรีวิวหนังสือราชการ A4
          </div>

          {/* Official Emblem & Header */}
          <div className="text-center relative pt-4 pb-2">
            {/* Garuda Symbol placeholder */}
            <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center border-2 border-slate-300 rounded-full text-slate-700 font-serif font-bold text-xs bg-slate-50">
              [ตราครุฑ]
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">บันทึกข้อความ</h2>
          </div>

          {/* Memo Meta Fields */}
          <div className="mt-6 space-y-2 border-b border-slate-900 pb-3">
            <div className="flex items-baseline">
              <span className="font-bold w-24 flex-shrink-0">ส่วนราชการ:</span>
              <span className="flex-1 text-slate-800">{department || "..........................................................."}</span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex items-baseline flex-1">
                <span className="font-bold w-12 flex-shrink-0">ที่:</span>
                <span className="flex-1 font-mono text-slate-800">{docNumber || "......................................."}</span>
              </div>
              <div className="flex items-baseline flex-1">
                <span className="font-bold w-16 flex-shrink-0">วันที่:</span>
                <span className="flex-1 text-slate-800">{date || "......................................."}</span>
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold w-16 flex-shrink-0">เรื่อง:</span>
              <span className="font-bold text-slate-900 flex-1">{subject || "..........................................................."}</span>
            </div>
          </div>

          {/* Addressee */}
          <div className="mt-4 flex items-baseline">
            <span className="font-bold w-16 flex-shrink-0">เรียน:</span>
            <span className="text-slate-800">{to || "..........................................................."}</span>
          </div>

          {/* Body Paragraphs */}
          <div className="mt-4 space-y-3 leading-relaxed text-justify text-slate-800">
            {p1 && <p className="indent-12">{p1}</p>}
            {p2 && <p className="indent-12">{p2}</p>}
            {p3 && <p className="indent-12">{p3}</p>}
          </div>

          {/* Signature Block */}
          <div className="mt-14 float-right text-center min-w-[240px]">
            <p className="text-slate-400 text-xs mb-8">(ลงชื่อ)........................................................</p>
            <p className="font-medium text-slate-900">({signatoryName || "......................................................."})</p>
            <p className="text-xs text-slate-600 mt-1">{signatoryPosition || "......................................................."}</p>
          </div>
          <div className="clear-both"></div>
        </div>
      </div>
    </div>
  );
}
