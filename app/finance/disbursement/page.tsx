"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wallet, Plus, Download, Printer, Trash2, CheckCircle2, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { exportTableToExcel, printDocumentView, exportMemoToWord } from "@/lib/documentGenerator";

interface TeacherDisburseItem {
  id: number;
  teacherName: string;
  courseCode: string;
  courseName: string;
  hours: number;
  ratePerHour: number;
  total: number;
  taxDeduction: number;
  netAmount: number;
}

export default function TeachingDisbursementPage() {
  const [periodMonth, setPeriodMonth] = useState("กันยายน 2569");
  const [program, setProgram] = useState("ระดับปริญญาตรี ภาค กศ.ปช. ภาคเรียนที่ 1/2569");
  
  const [items, setItems] = useState<TeacherDisburseItem[]>([
    {
      id: 1,
      teacherName: "ผศ.ดร. นฤมล อนันตโชค",
      courseCode: "BUS3201",
      courseName: "การบริหารธุรกิจสร้างสรรค์และสตาร์ทอัพ",
      hours: 16,
      ratePerHour: 600,
      total: 9600,
      taxDeduction: 96,
      netAmount: 9504
    },
    {
      id: 2,
      teacherName: "อ.ฤทธิชัย ภาระวิเศษ",
      courseCode: "POL2104",
      courseName: "การเมืองการปกครองและนโยบายสาธารณะ",
      hours: 16,
      ratePerHour: 500,
      total: 8000,
      taxDeduction: 80,
      netAmount: 7920
    },
    {
      id: 3,
      teacherName: "ดร.สุรชัย นวัตกร",
      courseCode: "ENG1102",
      courseName: "ระบบอัตโนมัติและนวัตกรรมชุมชน",
      hours: 12,
      ratePerHour: 500,
      total: 6000,
      taxDeduction: 60,
      netAmount: 5940
    }
  ]);

  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newHours, setNewHours] = useState(16);
  const [newRate, setNewRate] = useState(500);

  const grandTotal = items.reduce((sum, i) => sum + i.total, 0);
  const grandTax = items.reduce((sum, i) => sum + i.taxDeduction, 0);
  const grandNet = items.reduce((sum, i) => sum + i.netAmount, 0);

  const handleAddItem = () => {
    if (newName.trim() && newHours > 0) {
      const total = newHours * newRate;
      const tax = total * 0.01;
      const net = total - tax;
      setItems([
        ...items,
        {
          id: items.length + 1,
          teacherName: newName.trim(),
          courseCode: newCode.trim() || "GEN1001",
          courseName: newCourse.trim() || "วิชาศึกษาทั่วไป",
          hours: newHours,
          ratePerHour: newRate,
          total,
          taxDeduction: tax,
          netAmount: net
        }
      ]);
      setNewName("");
      setNewCode("");
      setNewCourse("");
    }
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleExportExcel = () => {
    const data = items.map((i, idx) => ({
      "ลำดับ": idx + 1,
      "ชื่อ - สกุล อาจารย์ผู้สอน": i.teacherName,
      "รหัสวิชา": i.courseCode,
      "ชื่อรายวิชา": i.courseName,
      "จำนวนชั่วโมง": i.hours,
      "อัตรา/ชม. (บาท)": i.ratePerHour,
      "รวมเป็นเงิน (บาท)": i.total,
      "ภาษีหัก ณ ที่จ่าย 1%": i.taxDeduction,
      "ยอดจ่ายสุทธิ (บาท)": i.netAmount
    }));
    exportTableToExcel(data, `รายละเอียดเบิกค่าสอน_${periodMonth.replace(' ', '_')}`, "เบิกค่าสอน");
  };

  const handleExportWord = async () => {
    await exportMemoToWord({
      department: "งานบริการการศึกษา คณะศิลปศาสตร์และวิทยาศาสตร์",
      docNumber: "อว 0604.05/ว 089",
      date: new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }),
      to: "อธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ (ผ่านกองคลัง)",
      subject: `ขออนุมัติเบิกจ่ายค่าตอบแทนการจัดการเรียนการสอน ${program} ประจำเดือน ${periodMonth}`,
      paragraphs: [
        `ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ ได้จัดการเรียนการสอน ${program} ประจำเดือน ${periodMonth} เสร็จสิ้นเรียบร้อยแล้ว`,
        `ในการนี้ เพื่อให้การเบิกจ่ายค่าตอบแทนเป็นไปตามระเบียบมหาวิทยาลัยราชภัฏชัยภูมิ พ.ศ. 2566 จึงขออนุมัติเบิกจ่ายเงินค่าตอบแทนแก่อาจารย์ผู้สอนจำนวน ${items.length} ท่าน เป็นจำนวนเงินทั้งสิ้น ${grandTotal.toLocaleString()} บาท (หักภาษี ณ ที่จ่าย ${grandTax.toLocaleString()} บาท ยอดจ่ายสุทธิ ${grandNet.toLocaleString()} บาท) รายละเอียดดังแนบ`,
        `จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ`
      ],
      signatoryName: "ผู้ช่วยศาสตราจารย์ ดร.นฤมล อนันตโชค",
      signatoryPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์"
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/finance" className="text-xs text-blue-800 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปหน้ารวมการเงิน
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            เบิกจ่ายค่าตอบแทนการสอนและค่านิเทศ (Remuneration Disbursement)
          </h1>
          <p className="text-xs text-slate-500">
            คำนวณชั่วโมงสอน อัตราค่าตอบแทน หักภาษี 1% และส่งออกตาราง Excel (.xlsx) และหนังสืออนุมัติจ่าย (.docx)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle"
          >
            <Download className="w-4 h-4 text-blue-900" />
            <span>หนังสืออนุมัติ (.docx)</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออกตาราง Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Main Table Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4 text-xs text-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-slate-100">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">ประจำเดือน / งวดที่เบิก</label>
            <input
              type="text"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
              className="w-full border rounded-lg p-2 font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">หลักสูตร / ภาคการศึกษา</label>
            <input
              type="text"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="w-full border rounded-lg p-2 font-medium"
            />
          </div>
        </div>

        {/* Teachers Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                <th className="py-2.5 px-3">ชื่อ - สกุล อาจารย์ผู้สอน</th>
                <th className="py-2.5 px-3">รหัส - ชื่อรายวิชา</th>
                <th className="py-2.5 px-3 text-center">ชั่วโมง</th>
                <th className="py-2.5 px-3 text-right">อัตรา/ชม.</th>
                <th className="py-2.5 px-3 text-right">รวมเงิน</th>
                <th className="py-2.5 px-3 text-right">ภาษี 1%</th>
                <th className="py-2.5 px-3 text-right">ยอดสุทธิ</th>
                <th className="py-2.5 px-3 w-12 text-center no-print">ลบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-center font-mono">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{item.teacherName}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-slate-500 mr-1.5">{item.courseCode}</span>
                    <span>{item.courseName}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">{item.hours}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{item.ratePerHour.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium">{item.total.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{item.taxDeduction.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">{item.netAmount.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-center no-print">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
              <tr className="text-slate-900">
                <td colSpan={5} className="py-3 px-3 text-right">รวมยอดเบิกจ่ายทั้งสิ้น ({items.length} ท่าน):</td>
                <td className="py-3 px-3 text-right font-mono">{grandTotal.toLocaleString()} ฿</td>
                <td className="py-3 px-3 text-right font-mono text-slate-500">{grandTax.toLocaleString()} ฿</td>
                <td className="py-3 px-3 text-right font-mono text-blue-900 text-sm">{grandNet.toLocaleString()} ฿</td>
                <td className="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Add Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 no-print">
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="ชื่ออาจารย์ผู้สอน..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border rounded-lg p-2 bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="รหัสวิชา (เช่น BUS3201)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full border rounded-lg p-2 bg-white font-mono"
            />
          </div>
          <div className="sm:col-span-3">
            <input
              type="text"
              placeholder="ชื่อรายวิชา..."
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              className="w-full border rounded-lg p-2 bg-white"
            />
          </div>
          <div className="sm:col-span-1">
            <input
              type="number"
              placeholder="ชม."
              value={newHours}
              onChange={(e) => setNewHours(Number(e.target.value))}
              className="w-full border rounded-lg p-2 bg-white text-center font-mono"
            />
          </div>
          <div className="sm:col-span-2 flex gap-1">
            <input
              type="number"
              placeholder="บาท/ชม."
              value={newRate}
              onChange={(e) => setNewRate(Number(e.target.value))}
              className="w-full border rounded-lg p-2 bg-white text-right font-mono"
            />
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-2 bg-blue-900 text-white font-bold rounded-lg shadow-sm flex-shrink-0"
            >
              + เพิ่ม
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
