"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckSquare, Printer, Download, Sparkles, CheckCircle2, ArrowLeft, Layers } from "lucide-react";
import { printDocumentView } from "@/lib/documentGenerator";

const CHECKLIST_TYPES = {
  loan: {
    title: "ใบรายการเรียงลำดับเอกสารโครงการ (กรณีขอยืมเงินทดรองราชการ)",
    items: [
      "1. สัญญายืมเงิน (ฉบับจริง 2 ฉบับ)",
      "2. บันทึกข้อความขอยืมเงินทดรองราชการ ผ่านคณบดี",
      "3. โครงการที่ได้รับอนุมัติจากมหาวิทยาลัย/คณะ",
      "4. ตารางประมาณการค่าใช้จ่ายแจกแจงตามหมวด",
      "5. กำหนดการดำเนินงานโครงการ"
    ]
  },
  reimbursement: {
    title: "ใบรายการเรียงลำดับเอกสารโครงการ (กรณีเบิกจ่ายเงิน / ส่งใช้คืนเงินยืม)",
    items: [
      "1. หนังสือนำส่งหลักฐานการเบิกจ่าย / ส่งใช้คืนเงินยืม",
      "2. ใบเสร็จรับเงิน / ใบสำคัญรับเงิน (ฉบับจริง)",
      "3. ใบเบิกค่าตอบแทนวิทยากร พร้อมสำเนาบัตรประชาชน",
      "4. ใบลงทะเบียนผู้เข้าร่วมกิจกรรม / โครงการ",
      "5. ภาพถ่ายประกอบการดำเนินโครงการ (ไม่น้อยกว่า 6 ภาพ)",
      "6. รายงานผลการดำเนินโครงการฉบับสมบูรณ์"
    ]
  },
  travel: {
    title: "ใบรายการเรียงลำดับเอกสารการเดินทางไปปฏิบัติราชการ",
    items: [
      "1. บันทึกข้อความขออนุมัติเดินทางไปปฏิบัติราชการ",
      "2. หนังสือเชิญหรือคำสั่งให้ไปปฏิบัติราชการ",
      "3. ตารางประมาณการค่าใช้จ่าย (เบี้ยเลี้ยง, ที่พัก, ค่ายานพาหนะ)",
      "4. ใบขออนุมัติใช้ยานพาหนะส่วนกลางของคณะ"
    ]
  },
  teaching_fee: {
    title: "ใบรายการเรียงลำดับเอกสารเบิกค่าตอบแทนการสอน (กศ.ปช. / ค่านิเทศ)",
    items: [
      "1. หนังสือขออนุมัติเบิกจ่ายค่าสอน / ค่านิเทศ",
      "2. ตารางรายละเอียดการเบิกค่าสอนรายบุคคล (Excel)",
      "3. ตารางสอน / บัญชีลงเวลาปฏิบัติการสอน",
      "4. คำสั่งแต่งตั้งอาจารย์ผู้สอน / อาจารย์นิเทศ"
    ]
  }
};

export default function DocumentChecklistPage() {
  const [selectedType, setSelectedType] = useState<keyof typeof CHECKLIST_TYPES>("loan");
  const [applicantName, setApplicantName] = useState("อ.ฤทธิชัย ภาระวิเศษ");
  const [department, setDepartment] = useState("สาขาวิชารัฐศาสตร์");
  const [projectName, setProjectName] = useState("โครงการพัฒนาศักยภาพนักศึกษา ประจำปี 2569");
  const [amount, setAmount] = useState(35000);

  const current = CHECKLIST_TYPES[selectedType];
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true, 3: true, 4: true });

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
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
            ใบตรวจสอบรายการเรียงลำดับเอกสาร (Document Checklist)
          </h1>
          <p className="text-xs text-slate-500">
            สร้างใบปะหน้าตรวจเอกสารก่อนส่งฝ่ายการเงิน/เสนอคณบดี ตามแบบมาตรฐานของคณะ
          </p>
        </div>

        <button
          type="button"
          onClick={printDocumentView}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>พิมพ์ใบนำส่งตรวจเอกสาร (Print Slip)</span>
        </button>
      </div>

      {/* Checklist Selector Pills */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-subtle flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mr-2">
          <Layers className="w-3.5 h-3.5 text-blue-900" /> เลือกแบบเช็คลิสต์:
        </span>
        <button
          type="button"
          onClick={() => setSelectedType("loan")}
          className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            selectedType === "loan" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          1. ขอยืมเงินโครงการ
        </button>
        <button
          type="button"
          onClick={() => setSelectedType("reimbursement")}
          className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            selectedType === "reimbursement" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          2. เบิกจ่าย / ส่งใช้คืนเงินยืม
        </button>
        <button
          type="button"
          onClick={() => setSelectedType("travel")}
          className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            selectedType === "travel" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          3. ไปปฏิบัติราชการ
        </button>
        <button
          type="button"
          onClick={() => setSelectedType("teaching_fee")}
          className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            selectedType === "teaching_fee" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          4. เบิกค่าสอน / ค่านิเทศ
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="bg-white border border-slate-300 rounded-2xl p-8 md:p-12 shadow-card text-xs text-slate-900 space-y-6">
        <div className="text-center pb-4 border-b border-slate-200">
          <p className="font-bold text-base text-slate-900">{current.title}</p>
          <p className="text-slate-600 mt-0.5">คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ</p>
        </div>

        {/* Header Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="font-bold text-slate-700">ผู้ขออนุมัติ / หัวหน้าโครงการ: </span>
            <input
              type="text"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              className="border-b border-slate-300 bg-transparent px-1 font-semibold focus:outline-none"
            />
          </div>
          <div>
            <span className="font-bold text-slate-700">สาขาวิชา / หน่วยงาน: </span>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="border-b border-slate-300 bg-transparent px-1 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <span className="font-bold text-slate-700">โครงการ / เรื่อง: </span>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="border-b border-slate-300 bg-transparent px-1 w-2/3 focus:outline-none"
            />
          </div>
          <div>
            <span className="font-bold text-slate-700">จำนวนเงินที่เสนอขอ: </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="border-b border-slate-300 bg-transparent px-1 font-bold text-blue-900 focus:outline-none"
            /> บาท
          </div>
        </div>

        {/* Checklist items */}
        <div className="space-y-3">
          <p className="font-bold text-slate-900 text-sm">รายการเอกสารที่ต้องแนบตามลำดับ:</p>
          <div className="space-y-2">
            {current.items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => toggleCheck(idx)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  checkedItems[idx]
                    ? "bg-blue-50/50 border-blue-200 text-blue-950 font-medium"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    checkedItems[idx] ? "bg-blue-900 border-blue-900 text-white" : "border-slate-300 bg-white"
                  }`}>
                    {checkedItems[idx] && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span>{item}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  {checkedItems[idx] ? "แนบแล้ว" : "ยังไม่ได้แนบ"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Signature Blocks */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center">
          <div>
            <p className="text-slate-400 mb-8">(ลงชื่อ)........................................................</p>
            <p className="font-bold text-slate-900">({applicantName})</p>
            <p className="text-slate-500 text-[11px]">ผู้ขออนุมัติ / ผู้ยื่นเอกสาร</p>
          </div>
          <div>
            <p className="text-slate-400 mb-8">(ลงชื่อ)........................................................</p>
            <p className="font-bold text-slate-900">(เจ้าหน้าที่งานการเงินและพัสดุ)</p>
            <p className="text-slate-500 text-[11px]">ผู้ตรวจสอบความถูกต้องของเอกสาร</p>
          </div>
        </div>
      </div>
    </div>
  );
}
