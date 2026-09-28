"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Send, 
  Plus, 
  Search, 
  Download, 
  FileText, 
  CheckCircle2, 
  X,
  FileCheck
} from "lucide-react";
import { MOCK_OUTBOUND_DOCS } from "@/lib/mockData";
import { OutboundDocument } from "@/lib/types";
import { exportTableToExcel } from "@/lib/documentGenerator";

export default function OutboundDocsPage() {
  const [docs, setDocs] = useState<OutboundDocument[]>(MOCK_OUTBOUND_DOCS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    docNumber: `อว 0604.05/011${docs.length + 4}`,
    sendDate: new Date().toISOString().split("T")[0],
    title: "",
    recipient: "",
    category: "หนังสือภายนอก",
    signatory: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
  });

  const filteredDocs = docs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.recipient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc: OutboundDocument = {
      id: `out-${Date.now()}`,
      docNumber: formData.docNumber,
      sendDate: formData.sendDate,
      title: formData.title,
      recipient: formData.recipient,
      category: formData.category,
      signatory: formData.signatory,
      urgency: "normal",
      status: "signed",
      createdAt: new Date().toISOString(),
    };
    setDocs([newDoc, ...docs]);
    setShowAddModal(false);
  };

  const handleExportExcel = () => {
    const excelData = docs.map((d) => ({
      "เลขที่หนังสือส่ง": d.docNumber,
      "วันที่ส่ง": d.sendDate,
      "เรื่อง": d.title,
      "เรียน (ผู้รับ)": d.recipient,
      "ประเภท": d.category,
      "ผู้ลงนาม": d.signatory,
      "สถานะ": d.status
    }));
    exportTableToExcel(excelData, "ทะเบียนหนังสือส่ง_คณะศิลปศาสตร์ฯ_2569", "ทะเบียนส่ง");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-xs text-blue-800 hover:underline">
              ← กลับไปศูนย์ธุรการ
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            ทะเบียนหนังสือส่ง (Outbound Documents)
          </h1>
          <p className="text-xs text-slate-500">
            ออกเลขที่หนังสือส่งภายนอกและภายในคณะ พร้อมบันทึกผู้ลงนาม
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>ออกเลขหนังสือส่ง</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-subtle flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาเลขหนังสือส่ง, เรื่อง, ผู้รับ..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">เลขที่หนังสือส่ง</th>
                <th className="py-3 px-4 font-semibold">วันที่ส่ง</th>
                <th className="py-3 px-4 font-semibold">เรื่อง</th>
                <th className="py-3 px-4 font-semibold">เรียน (ผู้รับ)</th>
                <th className="py-3 px-4 font-semibold">ผู้ลงนาม</th>
                <th className="py-3 px-4 font-semibold">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {doc.docNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{doc.sendDate}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 max-w-sm">
                    {doc.title}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-[160px] truncate">{doc.recipient}</td>
                  <td className="py-3 px-4 text-slate-700">{doc.signatory}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> ออกเลขแล้ว
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Outbound Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-float w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-base text-slate-900">ขอออกเลขหนังสือส่งใหม่</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">เลขที่หนังสือส่ง</label>
                  <input
                    type="text"
                    required
                    value={formData.docNumber}
                    onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono bg-slate-50 focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">วันที่ส่ง</label>
                  <input
                    type="date"
                    required
                    value={formData.sendDate}
                    onChange={(e) => setFormData({ ...formData, sendDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">เรื่อง</label>
                <input
                  type="text"
                  placeholder="ระบุชื่อเรื่องที่ส่ง..."
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">เรียน (ผู้รับหนังสือ)</label>
                <input
                  type="text"
                  placeholder="เช่น อธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ / ผู้อำนวยการ..."
                  required
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ประเภทหนังสือ</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  >
                    <option value="หนังสือภายนอก">หนังสือภายนอก</option>
                    <option value="หนังสือภายใน">หนังสือภายใน</option>
                    <option value="คำสั่ง/ประกาศ">คำสั่ง/ประกาศ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ผู้ลงนาม</label>
                  <input
                    type="text"
                    value={formData.signatory}
                    onChange={(e) => setFormData({ ...formData, signatory: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow-sm"
                >
                  ออกเลขส่ง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
