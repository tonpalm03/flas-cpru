"use client";

import React, { useState, useEffect } from "react";
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
  FileCheck,
  AlertCircle,
  Clock,
  Building,
  User,
  Upload,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { 
  getInboundDocs, 
  createInboundDoc, 
  updateInboundDocStatus, 
  uploadDocumentFile 
} from "@/lib/firebaseService";
import { InboundDocument, DocumentUrgency, DocumentStatus } from "@/lib/types";
import { exportTableToExcel } from "@/lib/documentGenerator";

const DEPARTMENT_OPTIONS = [
  "งานการเงินและงบประมาณ",
  "งานพัสดุและจัดซื้อ",
  "งานบริหารบุคคล",
  "งานแผนและยุทธศาสตร์",
  "งานวิชาการและวิจัย",
  "สาขาวิชารัฐศาสตร์",
  "สาขาวิชาวิศวกรรมการผลิต",
  "สาขาวิชาบริหารธุรกิจ",
  "สาขาวิชาภาษาอังกฤษและภาษาต่างประเทศ",
  "สำนักงานคณบดี"
];

export default function InboundDocsPage() {
  const { currentUser, isAdmin } = useRole();
  const [docs, setDocs] = useState<InboundDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDept, setFilterDept] = useState<string>("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDocForRouting, setSelectedDocForRouting] = useState<InboundDocument | null>(null);
  const [routingDept, setRoutingDept] = useState("");
  const [routingPerson, setRoutingPerson] = useState("");
  const [routingActionNote, setRoutingActionNote] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Form states for new inbound document
  const [formData, setFormData] = useState({
    docNumber: "",
    receiveDate: new Date().toISOString().split("T")[0],
    title: "",
    sender: "",
    urgency: "normal" as DocumentUrgency,
    category: "หนังสือภายนอก",
    assignedDept: "งานการเงินและงบประมาณ",
    assignedPerson: "",
    actionNote: "เพื่อโปรดทราบและพิจารณาดำเนินการ",
  });

  const fetchDocs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInboundDocs();
      // Sort newest first
      setDocs(data.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()));
    } catch (err: any) {
      console.error("Error loading inbound docs:", err);
      setError("ไม่สามารถโหลดทะเบียนหนังสือรับได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.receiveNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.assignedDept && doc.assignedDept.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.assignedPerson && doc.assignedPerson.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesUrgency = filterUrgency === "all" || doc.urgency === filterUrgency;
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
    const matchesDept = filterDept === "all" || doc.assignedDept === filterDept;

    return matchesSearch && matchesUrgency && matchesStatus && matchesDept;
  });

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.sender) {
      alert("กรุณากรอกข้อมูลชื่อเรื่องและหน่วยงานผู้ส่งให้ครบถ้วน");
      return;
    }

    try {
      setSubmitting(true);
      let fileAttachmentUrl: string | undefined = undefined;

      if (selectedFile) {
        setUploadingFile(true);
        fileAttachmentUrl = await uploadDocumentFile(selectedFile, "inbound_attachments", currentUser);
        setUploadingFile(false);
      }

      const created = await createInboundDoc({
        docNumber: formData.docNumber || "อว 0604/---",
        receiveDate: formData.receiveDate,
        title: formData.title,
        sender: formData.sender,
        urgency: formData.urgency,
        category: formData.category,
        assignedDept: formData.assignedDept,
        assignedPerson: formData.assignedPerson,
        actionNote: formData.actionNote,
        status: formData.assignedDept ? "forwarded" : "pending_review",
        fileAttachment: fileAttachmentUrl
      }, currentUser);

      setDocs([created, ...docs]);
      setShowAddModal(false);
      setSelectedFile(null);

      // Reset form
      setFormData({
        docNumber: "",
        receiveDate: new Date().toISOString().split("T")[0],
        title: "",
        sender: "",
        urgency: "normal",
        category: "หนังสือภายนอก",
        assignedDept: "งานการเงินและงบประมาณ",
        assignedPerson: "",
        actionNote: "เพื่อโปรดทราบและพิจารณาดำเนินการ",
      });
    } catch (err: any) {
      console.error("Failed to create inbound doc:", err);
      alert("เกิดข้อผิดพลาดในการลงรับหนังสือ: " + (err.message || "โปรดลองใหม่อีกครั้ง"));
    } finally {
      setSubmitting(false);
      setUploadingFile(false);
    }
  };

  const handleUpdateStatus = async (docId: string, newStatus: DocumentStatus, actionNote?: string, dept?: string) => {
    try {
      await updateInboundDocStatus(docId, newStatus, actionNote, dept, currentUser);
      setDocs(docs.map(d => d.id === docId ? { 
        ...d, 
        status: newStatus, 
        ...(actionNote && { actionNote }), 
        ...(dept && { assignedDept: dept }) 
      } : d));
      setSelectedDocForRouting(null);
    } catch (err: any) {
      alert("ไม่สามารถอัปเดตสถานะได้: " + err.message);
    }
  };

  const handleExportExcel = () => {
    const excelData = filteredDocs.map((d) => ({
      "เลขรับคณะ": d.receiveNumber,
      "วันที่รับ": d.receiveDate,
      "เลขที่หนังสือต้นทาง": d.docNumber,
      "จากหน่วยงาน": d.sender,
      "เรื่อง": d.title,
      "ความเร่งด่วน": 
        d.urgency === "most_urgent" ? "ด่วนที่สุด" :
        d.urgency === "very_urgent" ? "ด่วนมาก" : 
        d.urgency === "urgent" ? "ด่วน" : "ปกติ",
      "หมวดหมู่": d.category,
      "ส่งต่อฝ่าย/สาขา": d.assignedDept || "-",
      "ผู้รับมอบหมาย": d.assignedPerson || "-",
      "ข้อสั่งการ": d.actionNote || "-",
      "สถานะ": 
        d.status === "completed" ? "เสร็จสิ้น/ปิดเรื่อง" :
        d.status === "forwarded" ? "แทงเรื่องแล้ว" :
        d.status === "pending_review" ? "รอตรวจสอบ" : d.status
    }));

    exportTableToExcel(excelData, `ทะเบียนหนังสือรับ_คณะศิลปศาสตร์_${new Date().toISOString().split("T")[0]}`, "ทะเบียนหนังสือรับ");
  };

  const getUrgencyBadge = (urgency: DocumentUrgency) => {
    switch (urgency) {
      case "most_urgent":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">ด่วนที่สุด</span>;
      case "very_urgent":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">ด่วนมาก</span>;
      case "urgent":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">ด่วน</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">ปกติ</span>;
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "completed":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">ปิดเรื่องแล้ว</span>;
      case "forwarded":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">แทงเรื่องแล้ว</span>;
      case "pending_review":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">รอตรวจสอบ</span>;
      case "cancelled":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">ยกเลิก</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-xs text-blue-900 hover:underline">
              ← กลับไปศูนย์ธุรการ
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            ทะเบียนหนังสือรับ (Inbound Documents Registry)
          </h1>
          <p className="text-xs text-slate-500">
            ลงรับหนังสือจากหน่วยงานภายนอกและภายในมหาวิทยาลัย พร้อมระบบแทงเรื่องส่งต่อไปยังฝ่ายการเงิน พัสดุ และโครงการ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>ส่งออก Excel ({filteredDocs.length})</span>
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

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาเลขรับ, เลขที่หนังสือ, เรื่อง, หน่วยงานผู้ส่ง..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900/20 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Urgency Filter */}
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-blue-900"
          >
            <option value="all">ความเร่งด่วน: ทั้งหมด</option>
            <option value="normal">ปกติ</option>
            <option value="urgent">ด่วน</option>
            <option value="very_urgent">ด่วนมาก</option>
            <option value="most_urgent">ด่วนที่สุด</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-blue-900"
          >
            <option value="all">สถานะ: ทั้งหมด</option>
            <option value="pending_review">รอตรวจสอบ</option>
            <option value="forwarded">แทงเรื่องแล้ว</option>
            <option value="completed">ปิดเรื่องแล้ว</option>
          </select>

          {/* Department Filter */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-blue-900 max-w-[160px]"
          >
            <option value="all">ฝ่าย/สาขา: ทั้งหมด</option>
            {DEPARTMENT_OPTIONS.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <Clock className="w-6 h-6 animate-spin text-blue-900" />
            <span>กำลังโหลดข้อมูลทะเบียนหนังสือรับจากฐานข้อมูล...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">ไม่พบรายการหนังสือรับตามเงื่อนไข</p>
            <p className="text-slate-400 mt-0.5">ท่านสามารถกดปุ่ม "ลงรับหนังสือใหม่" เพื่อบันทึกหนังสือเข้าสู่ระบบ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">เลขรับคณะ</th>
                  <th className="py-3 px-4">วันที่รับ</th>
                  <th className="py-3 px-4">เลขที่หนังสือ / จาก</th>
                  <th className="py-3 px-4">เรื่อง</th>
                  <th className="py-3 px-4">ความเร่งด่วน</th>
                  <th className="py-3 px-4">ส่งต่อฝ่าย / ผู้รับ</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                      {doc.receiveNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {doc.receiveDate}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 font-mono text-[11px]">{doc.docNumber}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{doc.sender}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 line-clamp-2">{doc.title}</div>
                      {doc.actionNote && (
                        <div className="text-[11px] text-blue-800 font-normal italic mt-0.5">
                          สั่งการ: {doc.actionNote}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getUrgencyBadge(doc.urgency)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 text-[11px]">{doc.assignedDept || "ยังไม่ระบุ"}</div>
                      {doc.assignedPerson && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="w-2.5 h-2.5" /> {doc.assignedPerson}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {doc.fileAttachment && (
                          <a
                            href={doc.fileAttachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg transition-colors title='เปิดไฟล์แนบ'"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDocForRouting(doc);
                            setRoutingDept(doc.assignedDept || "งานการเงินและงบประมาณ");
                            setRoutingPerson(doc.assignedPerson || "");
                            setRoutingActionNote(doc.actionNote || "เพื่อโปรดทราบและพิจารณาดำเนินการ");
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>แทงเรื่อง</span>
                        </button>
                        {doc.status !== "completed" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(doc.id, "completed")}
                            className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors"
                            title="บันทึกรับทราบและปิดเรื่อง"
                          >
                            ปิดเรื่อง
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: New Inbound Document */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
                  <Inbox className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">ลงทะเบียนรับหนังสือราชการใหม่</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">วันที่ลงรับ</label>
                  <input
                    type="date"
                    value={formData.receiveDate}
                    onChange={(e) => setFormData({ ...formData, receiveDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลขที่หนังสือต้นทาง</label>
                  <input
                    type="text"
                    placeholder="เช่น อว 0604/1234 หรือ ที่ ชย 0017/..."
                    value={formData.docNumber}
                    onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">จากหน่วยงาน (ผู้ส่ง)</label>
                  <input
                    type="text"
                    placeholder="เช่น กองคลัง มหาวิทยาลัยราชภัฏชัยภูมิ"
                    value={formData.sender}
                    onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชั้นความเร่งด่วน</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value as DocumentUrgency })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none bg-white"
                  >
                    <option value="normal">ปกติ</option>
                    <option value="urgent">ด่วน</option>
                    <option value="very_urgent">ด่วนมาก</option>
                    <option value="most_urgent">ด่วนที่สุด</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อเรื่องหนังสือ</label>
                <textarea
                  rows={2}
                  placeholder="กรอกชื่อเรื่องตามหัวหนังสือราชการฉบับจริง..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">แทงเรื่อง/ส่งต่อฝ่าย</label>
                  <select
                    value={formData.assignedDept}
                    onChange={(e) => setFormData({ ...formData, assignedDept: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none bg-white"
                  >
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ระบุผู้รับผิดชอบเฉพาะ (ถ้ามี)</label>
                  <input
                    type="text"
                    placeholder="เช่น อ.ฤทธิชัย, คุณสมศรี"
                    value={formData.assignedPerson}
                    onChange={(e) => setFormData({ ...formData, assignedPerson: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ข้อสั่งการ / ความเห็นคณบดี</label>
                <input
                  type="text"
                  placeholder="เพื่อโปรดทราบและพิจารณาดำเนินการ"
                  value={formData.actionNote}
                  onChange={(e) => setFormData({ ...formData, actionNote: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>

              {/* File Attachment */}
              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <label className="block font-semibold text-slate-700 mb-1">แนบไฟล์สแกนหนังสือต้นฉบับ (PDF / รูปภาพ)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800"
                />
                {selectedFile && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    เลือกไฟล์: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังบันทึกและออกเลขรับ...</span>
                    </>
                  ) : (
                    <span>บันทึกและออกเลขรับอัตโนมัติ</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Routing / Dispatch Document */}
      {selectedDocForRouting && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">แทงเรื่อง / ส่งต่อหนังสือราชการ</h3>
                  <p className="text-[11px] text-slate-500 font-mono">เลขรับ {selectedDocForRouting.receiveNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocForRouting(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800 text-xs">{selectedDocForRouting.title}</p>
                <p className="text-[11px] text-slate-500 mt-1">จาก: {selectedDocForRouting.sender}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ส่งต่อไปยังฝ่าย / สาขาวิชา</label>
                <select
                  value={routingDept}
                  onChange={(e) => setRoutingDept(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none bg-white"
                >
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ระบุผู้รับมอบหมาย (อาจารย์ / เจ้าหน้าที่)</label>
                <input
                  type="text"
                  placeholder="เช่น อ.ดร.สานนท์, หัวหน้าโครงการ..."
                  value={routingPerson}
                  onChange={(e) => setRoutingPerson(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ข้อสั่งการ / ความเห็นการดำเนินงาน</label>
                <textarea
                  rows={2}
                  value={routingActionNote}
                  onChange={(e) => setRoutingActionNote(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDocForRouting(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedDocForRouting.id, "forwarded", routingActionNote, routingDept)}
                  className="px-5 py-2 text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-sm transition-all"
                >
                  ยืนยันการแทงเรื่อง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
