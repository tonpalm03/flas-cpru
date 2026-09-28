"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, Plus, Printer, Download, CheckCircle2, Calendar, FileText, X } from "lucide-react";
import { MOCK_LEAVE_REQUESTS } from "@/lib/mockData";
import { LeaveRequest } from "@/lib/types";
import { printDocumentView, exportTableToExcel } from "@/lib/documentGenerator";

export default function HRLeaveManagementPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>(MOCK_LEAVE_REQUESTS);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    staffName: "อ.ฤทธิชัย ภาระวิเศษ",
    position: "อาจารย์ประจำสาขาวิชารัฐศาสตร์",
    department: "สาขาวิชารัฐศาสตร์",
    leaveType: "vacation" as "vacation" | "sick" | "personal",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    totalDays: 3,
    reason: "ลาพักผ่อนประจำปี",
    substitutePerson: "อ.สมบัติ วิชาการ",
    contactAddress: "123 ม.2 ต.ในเมือง อ.เมือง จ.ชัยภูมิ โทร 081-xxxxxxx",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setLeaves([
      {
        id: `lv-${Date.now()}`,
        ...formData,
        status: "approved",
        createdAt: new Date().toISOString().split("T")[0]
      },
      ...leaves
    ]);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            ระบบบริหารงานบุคคลและการลา (HR & e-Leave)
          </h1>
          <p className="text-xs text-slate-500">
            ยื่นขออนุมัติลาพักผ่อน ลาป่วย ลากิจส่วนตัว ตามแบบฟอร์ม มรภ.ชัยภูมิ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={printDocumentView}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์แบบใบลา (PDF)</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>เขียนใบลาใหม่</span>
          </button>
        </div>
      </div>

      {/* Leave Quota Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <p className="text-xs text-slate-500">สิทธิลาพักผ่อนคงเหลือ (ปีงบ 2569)</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">10 วัน</p>
          <p className="text-[11px] text-slate-400 mt-0.5">ใช้ไปแล้ว 3 วัน (สะสมได้ตามระเบียบ)</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <p className="text-xs text-slate-500">สิทธิลากิจส่วนตัว</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">45 วัน</p>
          <p className="text-[11px] text-slate-400 mt-0.5">ยังไม่ได้ใช้สิทธิในปีนี้</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <p className="text-xs text-slate-500">สิทธิลาป่วย</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">60 วัน</p>
          <p className="text-[11px] text-slate-400 mt-0.5">แนบใบรับรองแพทย์เมื่อลาเกิน 3 วัน</p>
        </div>
      </div>

      {/* Leave History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900">
          ประวัติการขออนุมัติลา
        </div>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th className="py-3 px-4 font-semibold">ผู้ขอลา</th>
              <th className="py-3 px-4 font-semibold">ประเภทการลา</th>
              <th className="py-3 px-4 font-semibold">ช่วงวันที่ลา</th>
              <th className="py-3 px-4 font-semibold text-center">จำนวนวัน</th>
              <th className="py-3 px-4 font-semibold">เหตุผล</th>
              <th className="py-3 px-4 font-semibold">ผู้ปฏิบัติหน้าที่แทน</th>
              <th className="py-3 px-4 font-semibold">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {leaves.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-medium text-slate-900">
                  <div>{l.staffName}</div>
                  <div className="text-[10px] text-slate-400">{l.department}</div>
                </td>
                <td className="py-3 px-4 font-semibold text-blue-900">
                  {l.leaveType === "vacation" ? "ลาพักผ่อน" : l.leaveType === "sick" ? "ลาป่วย" : "ลากิจส่วนตัว"}
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {l.startDate} ถึง {l.endDate}
                </td>
                <td className="py-3 px-4 text-center font-bold text-slate-900">{l.totalDays} วัน</td>
                <td className="py-3 px-4">{l.reason}</td>
                <td className="py-3 px-4 text-slate-600">{l.substitutePerson}</td>
                <td className="py-3 px-4">
                  <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                    อนุมัติแล้ว
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-float w-full max-w-lg p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">ยื่นใบลาอิเล็กทรอนิกส์</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ชื่อผู้ลา</label>
                  <input
                    type="text"
                    required
                    value={formData.staffName}
                    onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ประเภทการลา</label>
                  <select
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as any })}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="vacation">ลาพักผ่อน (แบบใบลาพักผ่อน.pdf)</option>
                    <option value="sick">ลาป่วย (แบบใบลาป่วย.pdf)</option>
                    <option value="personal">ลากิจส่วนตัว</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ตั้งแต่วันที่</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border rounded-lg p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ถึงวันที่</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border rounded-lg p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">จำนวนวัน</label>
                  <input
                    type="number"
                    required
                    value={formData.totalDays}
                    onChange={(e) => setFormData({ ...formData, totalDays: Number(e.target.value) })}
                    className="w-full border rounded-lg p-1.5 text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">เหตุผลการลา</label>
                <input
                  type="text"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ผู้ปฏิบัติหน้าที่แทน</label>
                  <input
                    type="text"
                    required
                    value={formData.substitutePerson}
                    onChange={(e) => setFormData({ ...formData, substitutePerson: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ที่อยู่/เบอร์ติดต่อขณะลา</label>
                  <input
                    type="text"
                    value={formData.contactAddress}
                    onChange={(e) => setFormData({ ...formData, contactAddress: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl">
                  ยกเลิก
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-900 text-white rounded-xl font-bold">
                  ยื่นใบลา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
