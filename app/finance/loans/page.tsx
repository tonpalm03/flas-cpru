"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wallet, Plus, Download, Printer, CheckCircle2, AlertCircle, X, ArrowLeft } from "lucide-react";
import { MOCK_LOANS } from "@/lib/mockData";
import { LoanContract } from "@/lib/types";
import { exportTableToExcel, printDocumentView } from "@/lib/documentGenerator";

export default function LoanContractsPage() {
  const [loans, setLoans] = useState<LoanContract[]>(MOCK_LOANS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanContract | null>(null);

  const [formData, setFormData] = useState({
    contractNumber: `ยม. 02${loans.length + 1}/2569`,
    borrowerName: "อ.ฤทธิชัย ภาระวิเศษ",
    position: "อาจารย์ประจำสาขาวิชารัฐศาสตร์",
    purpose: "",
    amount: 25000,
    borrowDate: new Date().toISOString().split("T")[0],
    settleDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoans([
      {
        id: `loan-${Date.now()}`,
        ...formData,
        department: "คณะศิลปศาสตร์และวิทยาศาสตร์",
        status: "active",
        checklist: {
          hasContract: true,
          hasMemo: true,
          hasApprovedProject: true,
          hasEstimate: true
        },
        createdAt: new Date().toISOString()
      },
      ...loans
    ]);
    setShowAddModal(false);
  };

  const handleExportExcel = () => {
    const data = loans.map((l) => ({
      "สัญญาเลขที่": l.contractNumber,
      "ผู้ยืมเงิน": l.borrowerName,
      "ตำแหน่ง": l.position,
      "ยืมเพื่อโครงการ/งาน": l.purpose,
      "จำนวนเงินยืม (บาท)": l.amount,
      "วันที่ยืม": l.borrowDate,
      "กำหนดส่งใช้คืน": l.settleDueDate,
      "สถานะ": l.status === "active" ? "อยู่ระหว่างยืม" : "ส่งใช้คืนแล้ว"
    }));
    exportTableToExcel(data, "ทะเบียนสัญญายืมเงินทดรอง_คณะศิลปศาสตร์ฯ_2569", "สัญญายืมเงิน");
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/finance" className="text-xs text-blue-800 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปหน้ารวมการเงิน
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            สัญญายืมเงินทดรองราชการ (Advance Cash Loans)
          </h1>
          <p className="text-xs text-slate-500">
            ออกสัญญายืมเงินเพื่อดำเนินโครงการ ตรวจสอบเช็คลิสต์เอกสาร และติดตามการส่งใช้คืนเงินยืม
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก Excel</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างสัญญายืมเงิน</span>
          </button>
        </div>
      </div>

      {/* Checklist Guide Banner */}
      <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-card text-xs">
        <h3 className="font-bold text-blue-900 text-sm mb-1">
          เช็คลิสต์เอกสารประกอบการยืมเงินโครงการ (Checklist ตามระเบียบการเงิน)
        </h3>
        <p className="text-slate-500 mb-3">
          อ้างอิงจากแบบฟอร์ม "ใบรายการเรียงลำดับเอกสาร โครงการ (กรณียืมเงิน)" ของคณะ:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-slate-700">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>1. สัญญายืมเงิน 2 ฉบับ</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>2. บันทึกข้อความขอยืมเงิน</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>3. โครงการที่ได้รับอนุมัติ</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>4. ประมาณการค่าใช้จ่าย</span>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th className="py-3 px-4 font-semibold">สัญญาเลขที่</th>
              <th className="py-3 px-4 font-semibold">ผู้ยืมเงิน</th>
              <th className="py-3 px-4 font-semibold">โครงการที่ขอยืม</th>
              <th className="py-3 px-4 font-semibold text-right">จำนวนเงิน (บาท)</th>
              <th className="py-3 px-4 font-semibold">วันที่ยืม</th>
              <th className="py-3 px-4 font-semibold">กำหนดส่งใช้คืน</th>
              <th className="py-3 px-4 font-semibold">สถานะ</th>
              <th className="py-3 px-4 font-semibold text-center">เอกสาร</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loans.map((loan) => (
              <tr key={loan.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{loan.contractNumber}</td>
                <td className="py-3 px-4 font-medium text-slate-900">
                  <div>{loan.borrowerName}</div>
                  <div className="text-[10px] text-slate-400">{loan.position}</div>
                </td>
                <td className="py-3 px-4 max-w-xs">{loan.purpose}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                  {loan.amount.toLocaleString()} ฿
                </td>
                <td className="py-3 px-4 text-slate-500">{loan.borrowDate}</td>
                <td className="py-3 px-4 text-slate-600 font-medium">{loan.settleDueDate}</td>
                <td className="py-3 px-4">
                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                    อยู่ระหว่างยืม
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => setSelectedLoan(loan)}
                    className="text-xs bg-slate-100 hover:bg-blue-900 hover:text-white px-2.5 py-1 rounded-lg transition-colors font-medium"
                  >
                    ดูสัญญา
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Loan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-float w-full max-w-lg p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">สร้างสัญญายืมเงินทดรองราชการ</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">สัญญาเลขที่</label>
                  <input
                    type="text"
                    required
                    value={formData.contractNumber}
                    onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                    className="w-full border rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">จำนวนเงินยืม (บาท)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full border rounded-lg p-2 font-bold text-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">ชื่อผู้ยืม</label>
                <input
                  type="text"
                  required
                  value={formData.borrowerName}
                  onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">ยืมเพื่อโครงการ / วัตถุประสงค์</label>
                <textarea
                  required
                  rows={2}
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full border rounded-lg p-2 resize-none"
                  placeholder="ระบุชื่อโครงการและกิจกรรม..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">วันที่ยืม</label>
                  <input
                    type="date"
                    required
                    value={formData.borrowDate}
                    onChange={(e) => setFormData({ ...formData, borrowDate: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">กำหนดส่งใช้คืน (30 วัน)</label>
                  <input
                    type="date"
                    required
                    value={formData.settleDueDate}
                    onChange={(e) => setFormData({ ...formData, settleDueDate: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl">
                  ยกเลิก
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-900 text-white rounded-xl font-bold">
                  บันทึกสัญญา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Loan View Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-float w-full max-w-lg p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                สัญญายืมเงิน: {selectedLoan.contractNumber}
              </h3>
              <button type="button" onClick={() => setSelectedLoan(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <p>• <strong>ผู้ยืม:</strong> {selectedLoan.borrowerName} ({selectedLoan.position})</p>
              <p>• <strong>โครงการ:</strong> {selectedLoan.purpose}</p>
              <p>• <strong>จำนวนเงิน:</strong> <span className="font-bold text-blue-900">{selectedLoan.amount.toLocaleString()} บาท</span></p>
              <p>• <strong>วันที่ยืม:</strong> {selectedLoan.borrowDate} • <strong>กำหนดคืน:</strong> {selectedLoan.settleDueDate}</p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2 space-y-1">
                <span className="font-bold text-slate-900 block">สถานะเอกสารประกอบ (Checklist):</span>
                <p className="text-emerald-700 font-medium">✓ แนบสัญญายืมเงินฉบับจริงแล้ว</p>
                <p className="text-emerald-700 font-medium">✓ บันทึกข้อความขอยืมเงินผ่านคณบดีอนุมัติแล้ว</p>
                <p className="text-emerald-700 font-medium">✓ โครงการและตารางงบประมาณถูกต้อง</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={printDocumentView}
                className="px-4 py-2 bg-blue-900 text-white font-bold rounded-xl text-xs"
              >
                พิมพ์สัญญา
              </button>
              <button
                type="button"
                onClick={() => setSelectedLoan(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl text-xs"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
