"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Inbox, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Send, 
  Eye, 
  Paperclip,
  Share2,
  Calendar,
  X,
  FileCheck
} from "lucide-react";
import { MOCK_INBOUND_DOCS } from "@/lib/mockData";
import { InboundDocument, DocumentUrgency } from "@/lib/types";
import { exportTableToExcel } from "@/lib/documentGenerator";

export default function InboundDocsPage() {
  const [docs, setDocs] = useState<InboundDocument[]>(MOCK_INBOUND_DOCS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDocForRouting, setSelectedDocForRouting] = useState<InboundDocument | null>(null);

  // Form states for new inbound document
  const [formData, setFormData] = useState({
    docNumber: "",
    receiveNumber: `04${docs.length + 2}/2569`,
    receiveDate: new Date().toISOString().split("T")[0],
    title: "",
    sender: "",
    urgency: "normal" as DocumentUrgency,
    category: "หนังสือภายนอก",
    assignedDept: "งานการเงิน",
    assignedPerson: "",
    actionNote: "",
  });

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.receiveNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.sender.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUrgency = filterUrgency === "all" || doc.urgency === filterUrgency;
    return matchesSearch && matchesUrgency;
  });

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc: InboundDocument = {
      id: `in-${Date.now()}`,
      docNumber: formData.docNumber || "อว 0604/---",
      receiveNumber: formData.receiveNumber,
      receiveDate: formData.receiveDate,
      title: formData.title,
      sender: formData.sender,
      urgency: formData.urgency,
      category: formData.category,
      assignedDept: formData.assignedDept,
      assignedPerson: formData.assignedPerson,
      actionNote: formData.actionNote || "เพื่อโปรดทราบและดำเนินการ",
      status: formData.assignedDept ? "forwarded" : "pending_review",
      createdAt: new Date().toISOString(),
    };

    setDocs([newDoc, ...docs]);
    setShowAddModal(false);
    // Reset form
    setFormData({
      docNumber: "",
      receiveNumber: `04${docs.length + 3}/2569`,
      receiveDate: new Date().toISOString().split("T")[0],
      title: "",
      sender: "",
      urgency: "normal",
      category: "หนังสือภายนอก",
      assignedDept: "งานการเงิน",
      assignedPerson: "",
      actionNote: "",
    });
  };

  const handleExportExcel = () => {
    const excelData = docs.map((d) => ({
      "เลขรับคณะ": d.receiveNumber,
      "วันที่รับ": d.receiveDate,
      "เลขที่หนังสือต้นทาง": d.docNumber,
      "จากหน่วยงาน": d.sender,
      "เรื่อง": d.title,
      "ความเร่งด่วน": d.urgency === "very_urgent" ? "ด่วนมาก" : d.urgency === "urgent" ? "ด่วน" : "ปกติ",
      "ส่งต่อหน่วยงาน": d.assignedDept || "-",
      "ผู้รับผิดชอบ": d.assignedPerson || "-",
      "ข้อสั่งการ": d.actionNote || "-",
      "สถานะ": d.status
    }));
    exportTableToExcel(excelData, "ทะเบียนหนังสือรับ_คณะศิลปศาสตร์ฯ_2569", "ทะเบียนรับ");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-xs text-blue-800 hover:underline">
              ← กลับไปศูนย์ธุรการ
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            ทะเบียนหนังสือรับ (Inbound Documents)
          </h1>
          <p className="text-xs text-slate-500">
            ระบบบันทึกลงรับหนังสือจากภายนอก/มหาวิทยาลัย และแทงเรื่องต่อไปยังฝ่ายต่าง ๆ
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
            <span>ลงรับหนังสือใหม่</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาเลขรับ, เลขหนังสือ, เรื่อง, หน่วยงานส่ง..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> ความเร่งด่วน:
          </span>
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-800"
          >
            <option value="all">ทั้งหมด</option>
            <option value="normal">ปกติ</option>
            <option value="urgent">ด่วน</option>
            <option value="very_urgent">ด่วนมาก</option>
          </select>
        </div>
      </div>

      {/* Inbound Document Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">เลขรับคณะ</th>
                <th className="py-3 px-4 font-semibold">เลขที่ต้นทาง</th>
                <th className="py-3 px-4 font-semibold">วันที่รับ</th>
                <th className="py-3 px-4 font-semibold">เรื่อง</th>
                <th className="py-3 px-4 font-semibold">จากหน่วยงาน</th>
                <th className="py-3 px-4 font-semibold">แทงเรื่อง / ส่งต่อ</th>
                <th className="py-3 px-4 font-semibold">สถานะ</th>
                <th className="py-3 px-4 font-semibold text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {doc.receiveNumber}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{doc.docNumber}</td>
                  <td className="py-3 px-4 text-slate-500">{doc.receiveDate}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 max-w-sm">
                      {doc.title}
                    </div>
                    {doc.actionNote && (
                      <div className="text-[10px] text-blue-900 mt-0.5 bg-blue-50/70 px-1.5 py-0.5 rounded inline-block">
                        สั่งการ: {doc.actionNote}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-[140px] truncate">{doc.sender}</td>
                  <td className="py-3 px-4">
                    {doc.assignedDept ? (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-900 font-medium px-2 py-0.5 rounded text-[11px]">
                        <Send className="w-3 h-3" /> {doc.assignedDept}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">ยังไม่แทงเรื่อง</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      doc.status === "forwarded" 
                        ? "bg-blue-100 text-blue-900" 
                        : doc.status === "signed" 
                        ? "bg-emerald-100 text-emerald-900" 
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {doc.status === "forwarded" ? "แทงเรื่องแล้ว" : doc.status === "signed" ? "ลงนามแล้ว" : "รอดำเนินการ"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedDocForRouting(doc)}
                      className="text-xs bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 font-medium px-2.5 py-1 rounded-lg transition-all"
                    >
                      แทงเรื่อง / รายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Inbound Doc Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-float w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-base text-slate-900">ลงรับหนังสือใหม่</h3>
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
                  <label className="block font-medium text-slate-700 mb-1">เลขรับคณะ</label>
                  <input
                    type="text"
                    required
                    value={formData.receiveNumber}
                    onChange={(e) => setFormData({ ...formData, receiveNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-mono focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">วันที่รับ</label>
                  <input
                    type="date"
                    required
                    value={formData.receiveDate}
                    onChange={(e) => setFormData({ ...formData, receiveDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">เลขที่หนังสือต้นทาง</label>
                  <input
                    type="text"
                    placeholder="เช่น อว 0604/ว 115"
                    required
                    value={formData.docNumber}
                    onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ความเร่งด่วน</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value as DocumentUrgency })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  >
                    <option value="normal">ปกติ</option>
                    <option value="urgent">ด่วน</option>
                    <option value="very_urgent">ด่วนมาก</option>
                    <option value="most_urgent">ด่วนที่สุด</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">เรื่อง (ชื่อหนังสือ)</label>
                <input
                  type="text"
                  placeholder="ระบุชื่อเรื่องของหนังสือ..."
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">จากหน่วยงาน</label>
                <input
                  type="text"
                  placeholder="เช่น กองนโยบายและแผน, กองคลัง, อบต. ..."
                  required
                  value={formData.sender}
                  onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>

              {/* Cross-Module Routing */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <label className="block font-bold text-blue-900">
                  แทงเรื่อง / ส่งต่อไปยังฝ่ายที่เกี่ยวข้อง (Workflow Routing)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ฝ่ายปลายทาง</label>
                    <select
                      value={formData.assignedDept}
                      onChange={(e) => setFormData({ ...formData, assignedDept: e.target.value })}
                      className="w-full border border-slate-200 bg-white rounded-lg p-1.5 focus:border-blue-900 focus:outline-none"
                    >
                      <option value="งานการเงิน">งานการเงิน (Finance)</option>
                      <option value="งานพัสดุ">งานพัสดุ (Procurement)</option>
                      <option value="งานโครงการและแผน">งานโครงการและแผน</option>
                      <option value="งานบริหารงานบุคคล">งานบริหารงานบุคคล (HR)</option>
                      <option value="สำนักงานคณบดี">สำนักงานคณบดี</option>
                      <option value="ทุกสาขาวิชา">ทุกสาขาวิชา</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ข้อสั่งการ / เกษียน</label>
                    <input
                      type="text"
                      placeholder="เช่น เพื่อโปรดทราบและดำเนินการ"
                      value={formData.actionNote}
                      onChange={(e) => setFormData({ ...formData, actionNote: e.target.value })}
                      className="w-full border border-slate-200 bg-white rounded-lg p-1.5 focus:border-blue-900 focus:outline-none"
                    />
                  </div>
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
                  บันทึกลงรับหนังสือ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Routing & Detail Modal */}
      {selectedDocForRouting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-float w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                รายละเอียดหนังสือรับ: {selectedDocForRouting.receiveNumber}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDocForRouting(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <div>
                <span className="font-semibold text-slate-900">เรื่อง: </span>
                <span>{selectedDocForRouting.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg">
                <div>
                  <span className="text-slate-400 block">เลขที่ต้นทาง:</span>
                  <span className="font-mono font-medium">{selectedDocForRouting.docNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">จากหน่วยงาน:</span>
                  <span className="font-medium">{selectedDocForRouting.sender}</span>
                </div>
              </div>

              <div className="border border-blue-100 bg-blue-50/50 p-3 rounded-xl space-y-1">
                <span className="font-bold text-blue-900 block">เส้นทางการส่งต่อ (Routing History):</span>
                <p className="text-slate-600">
                  • ส่งต่อไปยัง: <strong className="text-slate-900">{selectedDocForRouting.assignedDept}</strong>
                </p>
                <p className="text-slate-600">
                  • ข้อสั่งการ: {selectedDocForRouting.actionNote || "เพื่อโปรดทราบและดำเนินการ"}
                </p>
                <p className="text-slate-400 text-[10px] mt-1">
                  สถานะปัจจุบัน: {selectedDocForRouting.status === "forwarded" ? "ส่งต่อไปยังฝ่ายปลายทางแล้ว" : "เสร็จสิ้น"}
                </p>
              </div>

              {selectedDocForRouting.fileAttachment && (
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-4 h-4 text-blue-800 flex-shrink-0" />
                    <span className="truncate">{selectedDocForRouting.fileAttachment}</span>
                  </div>
                  <span className="text-[10px] text-blue-800 font-semibold cursor-pointer hover:underline">
                    ดาวน์โหลด
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDocForRouting(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
