"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Package, 
  Plus, 
  Download, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  FileText,
  Clock,
  Building,
  User,
  Search,
  Filter,
  AlertCircle,
  X,
  FileCheck,
  DollarSign,
  Truck,
  Eye,
  Check,
  ShoppingBag,
  Layers,
  Calendar
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { 
  getProcurementPRs, 
  createProcurementPR, 
  updateProcurementPRStatus, 
  inspectProcurementPR, 
  getProjects 
} from "@/lib/firebaseService";
import { PurchaseRequisition, ProjectProposal } from "@/lib/types";
import { 
  exportPurchaseRequisitionExcel, 
  exportPurchaseRequisitionToWord, 
  printDocumentView 
} from "@/lib/documentGenerator";

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  draft: { label: "ร่างคำขอ", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  submitted: { label: "ยื่นคำขอแล้ว (รอดำเนินการ)", badge: "bg-blue-50 text-blue-900 border-blue-200" },
  budget_verified: { label: "ตรวจสอบงบแล้ว", badge: "bg-indigo-50 text-indigo-900 border-indigo-200" },
  approved: { label: "อนุมัติจัดซื้อแล้ว", badge: "bg-purple-50 text-purple-900 border-purple-200" },
  purchasing: { label: "กำลังจัดซื้อ / ออก PO", badge: "bg-amber-50 text-amber-900 border-amber-200" },
  delivered: { label: "ส่งมอบพัสดุแล้ว (รอตรวจรับ)", badge: "bg-cyan-50 text-cyan-900 border-cyan-200" },
  inspected: { label: "ตรวจรับพัสดุเรียบร้อย", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  sent_to_finance: { label: "ส่งเบิกจ่ายเงินแล้ว", badge: "bg-emerald-100 text-emerald-950 border-emerald-300" },
  cancelled: { label: "ยกเลิกคำขอ", badge: "bg-rose-50 text-rose-800 border-rose-200" }
};

export default function ProcurementPage() {
  const { currentUser, isAdmin, isDean, isProcurement, isFinance } = useRole();
  const [prs, setPrs] = useState<PurchaseRequisition[]>([]);
  const [projects, setProjects] = useState<ProjectProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequisition | null>(null);
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New PR Form State
  const [procurementType, setProcurementType] = useState<PurchaseRequisition["procurementType"]>("purchase");
  const [itemCategory, setItemCategory] = useState<PurchaseRequisition["itemCategory"]>("materials");
  const [projectName, setProjectName] = useState("โครงการพัฒนาทักษะวิชาชีพและการประยุกต์ใช้ AI เพื่อการตัดสินใจเชิงนโยบาย");
  const [projectCode, setProjectCode] = useState("69-FLAS-001");
  const [requesterName, setRequesterName] = useState(currentUser?.name || "อ.ฤทธิชัย ภาระวิเศษ");
  const [requesterPosition, setRequesterPosition] = useState("อาจารย์ประจำสาขาวิชารัฐศาสตร์");
  const [department, setDepartment] = useState(currentUser?.department || "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์");
  const [budgetSource, setBudgetSource] = useState<PurchaseRequisition["budgetSource"]>("faculty_revenue");
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split("T")[0]);
  const [requiredDeliveryDate, setRequiredDeliveryDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [reason, setReason] = useState("เพื่อใช้ประกอบการจัดกิจกรรมอบรมเชิงปฏิบัติการและฝึกทักษะนักศึกษา");
  const [supplierName, setSupplierName] = useState("บริษัท สยามเครื่องเขียนและไอที จำกัด");
  const [quotationNumber, setQuotationNumber] = useState("QT-2026-0941");
  const [vatRate, setVatRate] = useState<number>(7);

  // Inspection Committee Form State
  const [committeeMembers, setCommitteeMembers] = useState([
    { name: "ผศ.ดร. นฤมล อนันตโชค", position: "ประธานหลักสูตร", role: "president" as const },
    { name: "ดร.สุรชัย นวัตกร", position: "อาจารย์ประจำสาขา", role: "member" as const },
    { name: "นายสมเกียรติ วงศ์สารบรรณ", position: "เจ้าหน้าที่ธุรการ", role: "secretary" as const }
  ]);

  // Items List State
  const [items, setItems] = useState([
    { itemNumber: 1, description: "กระดาษ A4 80 แกรม (Double A)", quantity: 20, unit: "รีม", unitPrice: 145, totalPrice: 2900 },
    { itemNumber: 2, description: "หมึกพิมพ์เลเซอร์ HP LaserJet MFP", quantity: 2, unit: "กล่อง", unitPrice: 3800, totalPrice: 7600 },
    { itemNumber: 3, description: "แฟ้มเสนอเซ็นและเครื่องเขียนจัดอบรม", quantity: 40, unit: "ชุด", unitPrice: 200, totalPrice: 8000 }
  ]);

  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("ชุด");
  const [newItemPrice, setNewItemPrice] = useState(0);

  // Inspection Modal State
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split("T")[0]);
  const [inspectionResult, setInspectionResult] = useState<"passed" | "failed">("passed");
  const [inspectionRemarks, setInspectionRemarks] = useState("ตรวจรับพัสดุครบถ้วน ถูกต้องตามใบเสนอราคาและคุณลักษณะเฉพาะทุกประการ");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prData, projData] = await Promise.all([
        getProcurementPRs(),
        getProjects()
      ]);
      setPrs(prData.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()));
      setProjects(projData);
    } catch (err: any) {
      console.error("Error loading procurement data:", err);
      setErrorMsg("ไม่สามารถโหลดทะเบียนจัดซื้อจัดจ้างได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalBeforeVat = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const vatAmount = Math.round(totalBeforeVat * (vatRate / 100));
  const netTotalAmount = totalBeforeVat + vatAmount;

  const handleAddItem = () => {
    if (newItemDesc.trim() && newItemPrice > 0) {
      const itemTotal = newItemQty * newItemPrice;
      setItems([
        ...items,
        {
          itemNumber: items.length + 1,
          description: newItemDesc.trim(),
          quantity: newItemQty,
          unit: newItemUnit,
          unitPrice: newItemPrice,
          totalPrice: itemTotal
        }
      ]);
      setNewItemDesc("");
      setNewItemQty(1);
      setNewItemPrice(0);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index).map((item, idx) => ({
      ...item,
      itemNumber: idx + 1
    }));
    setItems(updated);
  };

  const filteredPRs = prs.filter((p) => {
    const matchesSearch = 
      p.prNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const matchesType = filterType === "all" || p.procurementType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalProcurementBudget = prs.reduce((sum, p) => sum + (p.netTotalAmount || 0), 0);
  const pendingInspectionCount = prs.filter(p => p.status === "purchasing" || p.status === "delivered").length;
  const completedCount = prs.filter(p => p.status === "inspected" || p.status === "sent_to_finance").length;

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !requesterName.trim() || items.length === 0) {
      alert("กรุณากรอกข้อมูลโครงการ ผู้ขอซื้อ และเพิ่มรายการพัสดุอย่างน้อย 1 รายการ");
      return;
    }

    try {
      setSubmitting(true);
      const created = await createProcurementPR({
        procurementType,
        itemCategory,
        projectName: projectName.trim(),
        projectCode: projectCode.trim() || undefined,
        requesterName: requesterName.trim(),
        requesterPosition: requesterPosition.trim(),
        department: department.trim(),
        requestDate,
        requiredDeliveryDate,
        budgetSource,
        reason: reason.trim(),
        supplierName: supplierName.trim(),
        quotationNumber: quotationNumber.trim(),
        vatRate,
        totalAmountBeforeTax: totalBeforeVat,
        vatAmount,
        netTotalAmount,
        committeeMembers,
        status: "submitted",
        items
      }, currentUser);

      setShowAddModal(false);
      await fetchData();
    } catch (err: any) {
      console.error("Create PR error:", err);
      alert("เกิดข้อผิดพลาดในการสร้างใบขอซื้อ-ขอจ้าง: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (prId: string, newStatus: PurchaseRequisition["status"]) => {
    try {
      await updateProcurementPRStatus(prId, newStatus, {}, currentUser);
      await fetchData();
      if (selectedPR && selectedPR.id === prId) {
        setSelectedPR({ ...selectedPR, status: newStatus });
      }
    } catch (err: any) {
      alert("ไม่สามารถเปลี่ยนสถานะได้: " + err.message);
    }
  };

  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPR) return;

    try {
      setSubmitting(true);
      await inspectProcurementPR(selectedPR.id, {
        inspectionDate,
        inspectionResult,
        inspectionRemarks: inspectionRemarks.trim()
      }, currentUser);

      setShowInspectModal(false);
      await fetchData();
      if (selectedPR) {
        setSelectedPR({ 
          ...selectedPR, 
          status: inspectionResult === "passed" ? "inspected" : "purchasing",
          inspectionDate,
          inspectionResult,
          inspectionRemarks
        });
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการบันทึกผลการตรวจรับ: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = (pr?: PurchaseRequisition) => {
    const target = pr || selectedPR;
    if (target) {
      exportPurchaseRequisitionExcel(target);
    } else {
      const allRows = filteredPRs.map((p) => ({
        "เลขที่ขอซื้อ": p.prNumber,
        "ประเภท": p.procurementType === "hire" ? "ขอจ้าง" : "ขอซื้อ",
        "โครงการ": p.projectName,
        "ผู้ขอซื้อ": p.requesterName,
        "สาขาวิชา": p.department,
        "วันที่ขอ": p.requestDate,
        "กำหนดส่งมอบ": p.requiredDeliveryDate,
        "ยอดเงินรวมสุทธิ (บาท)": p.netTotalAmount,
        "ผู้ขาย/ผู้รับจ้าง": p.supplierName || "-",
        "สถานะ": STATUS_CONFIG[p.status]?.label || p.status
      }));
      exportPurchaseRequisitionExcel({
        prNumber: "PR-SUMMARY",
        projectName: "ทะเบียนคำขอซื้อขอจ้างประจำปี 2569",
        requesterName: "งานพัสดุและจัดซื้อ",
        department: "คณะศิลปศาสตร์และวิทยาศาสตร์",
        requestDate: new Date().toISOString().split("T")[0],
        items: []
      });
    }
  };

  const handleExportWord = (pr: PurchaseRequisition) => {
    exportPurchaseRequisitionToWord(pr);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">
              ระบบพัสดุและจัดซื้อจัดจ้าง (Procurement & Purchasing)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
              ตามระเบียบจัดซื้อจัดจ้างภาครัฐ 2560
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ทะเบียนขอซื้อ-ขอจ้าง ตรวจสอบวงเงินงบประมาณ แต่งตั้งคณะกรรมการตรวจรับพัสดุ และส่งออก Excel / Word (.docx)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={printDocumentView}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ / PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างใบขอซื้อ-ขอจ้าง</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">คำขอจัดซื้อจัดจ้างทั้งหมด</p>
            <Package className="w-4 h-4 text-blue-900" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">{prs.length} รายการ</p>
          <p className="text-[11px] text-slate-400 mt-1">ประจำปีงบประมาณ 2569</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">อยู่ระหว่างจัดซื้อ / รอตรวจรับ</p>
            <Truck className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2 font-mono">{pendingInspectionCount} รายการ</p>
          <p className="text-[11px] text-amber-700 mt-1 font-semibold">ออก PO แล้ว / รอส่งมอบ</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">ตรวจรับและส่งเบิกจ่ายแล้ว</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2 font-mono">{completedCount} รายการ</p>
          <p className="text-[11px] text-emerald-700 mt-1 font-semibold">เสร็จสิ้นกระบวนการพัสดุ</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">มูลค่าจัดซื้อจัดจ้างสะสมรวม</p>
            <DollarSign className="w-4 h-4 text-blue-900" />
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-2 font-mono">{totalProcurementBudget.toLocaleString()} ฿</p>
          <p className="text-[11px] text-slate-400 mt-1">ยอดรวมภาษีมูลค่าเพิ่มแล้ว</p>
        </div>
      </div>

      {/* Main Table & Filter Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-slate-200 rounded-lg p-2 bg-white text-xs font-semibold focus:border-blue-900 focus:outline-none"
            >
              <option value="all">ทุกประเภท (ขอซื้อ / ขอจ้าง)</option>
              <option value="purchase">ขอซื้อพัสดุ/ครุภัณฑ์</option>
              <option value="hire">ขอจ้างทำของ/บริการ</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-lg p-2 bg-white text-xs font-semibold focus:border-blue-900 focus:outline-none"
            >
              <option value="all">ทุกสถานะขั้นตอน</option>
              <option value="submitted">ยื่นคำขอแล้ว</option>
              <option value="approved">อนุมัติจัดซื้อแล้ว</option>
              <option value="purchasing">กำลังจัดซื้อ</option>
              <option value="delivered">ส่งมอบแล้ว (รอตรวจรับ)</option>
              <option value="inspected">ตรวจรับพัสดุแล้ว</option>
              <option value="sent_to_finance">ส่งเบิกจ่ายเงินแล้ว</option>
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่ PR, โครงการ, ผู้ขอ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:border-blue-900 focus:outline-none text-xs w-64"
            />
          </div>
        </div>

        {/* PR Registry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3 w-12 text-center">ลำดับ</th>
                <th className="p-3">เลขที่ขอซื้อ-ขอจ้าง</th>
                <th className="p-3">ประเภท / หมวด</th>
                <th className="p-3">โครงการ / วัตถุประสงค์</th>
                <th className="p-3">ผู้ขอซื้อ / สาขาวิชา</th>
                <th className="p-3 text-right">ยอดรวมสุทธิ (บาท)</th>
                <th className="p-3 text-center">กำหนดส่งมอบ</th>
                <th className="p-3 text-center">สถานะ</th>
                <th className="p-3 text-center w-28">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPRs.map((p, idx) => {
                const config = STATUS_CONFIG[p.status] || { label: p.status, badge: "bg-slate-100 text-slate-700" };
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-blue-900 block">{p.prNumber}</span>
                      <span className="text-[11px] text-slate-400">{p.requestDate}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">
                        {p.procurementType === "hire" ? "ขอจ้างทำของ" : "ขอซื้อพัสดุ"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {p.itemCategory === "equipment" ? "ครุภัณฑ์" : p.itemCategory === "service" ? "จ้างเหมาบริการ" : "วัสดุสำนักงาน/ฝึกอบรม"}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs">
                      <span className="font-medium text-slate-900 block truncate">{p.projectName}</span>
                      {p.supplierName && (
                        <span className="text-[11px] text-slate-500 block truncate">ร้าน: {p.supplierName}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{p.requesterName}</span>
                      <span className="text-[11px] text-slate-500">{p.department}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {p.netTotalAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-slate-800 font-medium">{p.requiredDeliveryDate}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${config.badge}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedPR(p)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 font-semibold rounded-lg text-xs transition-all"
                      >
                        รายละเอียด
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View PR Detail & Workflow Transitions */}
      {selectedPR && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-modal max-w-3xl w-full p-6 space-y-5 text-xs text-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedPR.prNumber}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  แบบขอซื้อ - ขอจ้าง ({selectedPR.procurementType === "hire" ? "ขอจ้าง" : "ขอซื้อ"})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPR(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metadata Summary */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-[11px] text-slate-500 block">ผู้ขอซื้อ/ขอจ้าง:</span>
                <span className="font-bold text-slate-900">{selectedPR.requesterName} ({selectedPR.requesterPosition || "อาจารย์"})</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">สาขาวิชา/หน่วยงาน:</span>
                <span className="font-bold text-slate-900">{selectedPR.department}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[11px] text-slate-500 block">เพื่อใช้ในโครงการ/งาน:</span>
                <span className="font-medium text-slate-900">{selectedPR.projectName} {selectedPR.projectCode ? `[${selectedPR.projectCode}]` : ""}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">ผู้เสนอราคา / ร้านค้า:</span>
                <span className="font-bold text-slate-900">{selectedPR.supplierName || "-"}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">กำหนดส่งมอบพัสดุ:</span>
                <span className="font-bold text-slate-900">{selectedPR.requiredDeliveryDate}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">แหล่งงบประมาณ:</span>
                <span className="font-medium text-slate-800">
                  {selectedPR.budgetSource === "national_budget" ? "งบประมาณแผ่นดิน" : "งบประมาณเงินรายได้คณะ"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">สถานะปัจจุบัน:</span>
                <span className={`inline-block px-2 py-0.5 rounded border text-[11px] font-bold ${STATUS_CONFIG[selectedPR.status]?.badge}`}>
                  {STATUS_CONFIG[selectedPR.status]?.label}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <p className="font-bold text-slate-900 mb-1.5">รายการพัสดุ / ครุภัณฑ์ / รายละเอียดค่าใช้จ่าย:</p>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2 text-center w-10">ลำดับ</th>
                      <th className="p-2">รายการพัสดุ / Spec</th>
                      <th className="p-2 text-center w-20">จำนวน</th>
                      <th className="p-2 text-center w-20">หน่วย</th>
                      <th className="p-2 text-right w-24">ราคา/หน่วย</th>
                      <th className="p-2 text-right w-28">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPR.items.map((item) => (
                      <tr key={item.itemNumber}>
                        <td className="p-2 text-center text-slate-400">{item.itemNumber}</td>
                        <td className="p-2 font-medium">{item.description}</td>
                        <td className="p-2 text-center font-mono">{item.quantity}</td>
                        <td className="p-2 text-center text-slate-500">{item.unit}</td>
                        <td className="p-2 text-right font-mono">{item.unitPrice.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono font-bold">{item.totalPrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-medium border-t border-slate-200">
                    <tr>
                      <td colSpan={5} className="p-2 text-right text-slate-600">รวมเป็นเงินทั้งสิ้น (ก่อน VAT):</td>
                      <td className="p-2 text-right font-mono font-bold">{selectedPR.totalAmountBeforeTax.toLocaleString()} ฿</td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="p-2 text-right text-slate-600">ภาษีมูลค่าเพิ่ม ({selectedPR.vatRate}%):</td>
                      <td className="p-2 text-right font-mono text-slate-600">{selectedPR.vatAmount.toLocaleString()} ฿</td>
                    </tr>
                    <tr className="bg-blue-50/70 font-bold text-blue-900">
                      <td colSpan={5} className="p-2 text-right">ยอดเงินรวมสุทธิทั้งสิ้น:</td>
                      <td className="p-2 text-right font-mono text-sm">{selectedPR.netTotalAmount.toLocaleString()} ฿</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Committee Members Roster */}
            {selectedPR.committeeMembers && selectedPR.committeeMembers.length > 0 && (
              <div>
                <p className="font-bold text-slate-900 mb-1.5">คณะกรรมการตรวจรับพัสดุ:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedPR.committeeMembers.map((c, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-[11px] text-slate-500">{c.position}</p>
                      <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 mt-1 inline-block">
                        {c.role === "president" ? "ประธานกรรมการ" : c.role === "secretary" ? "กรรมการและเลขานุการ" : "กรรมการ"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons & Workflow Transitions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportWord(selectedPR)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200"
                >
                  <Download className="w-4 h-4" />
                  <span>ส่งออก Word</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportPurchaseRequisitionExcel(selectedPR)}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-emerald-200"
                >
                  <Download className="w-4 h-4" />
                  <span>ส่งออก Excel</span>
                </button>
              </div>

              {/* Workflow Actions */}
              <div className="flex items-center gap-2">
                {selectedPR.status === "submitted" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedPR.id, "approved")}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-sm text-xs"
                  >
                    อนุมัติจัดซื้อจัดจ้าง
                  </button>
                )}

                {selectedPR.status === "approved" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedPR.id, "purchasing")}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm text-xs"
                  >
                    ออกใบสั่งซื้อ/สั่งจ้าง (PO)
                  </button>
                )}

                {selectedPR.status === "purchasing" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedPR.id, "delivered")}
                    className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl shadow-sm text-xs"
                  >
                    บันทึกว่าผู้ขายส่งมอบแล้ว
                  </button>
                )}

                {(selectedPR.status === "delivered" || selectedPR.status === "purchasing") && (
                  <button
                    type="button"
                    onClick={() => setShowInspectModal(true)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-sm text-xs flex items-center gap-1.5"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>บันทึกผลการตรวจรับพัสดุ</span>
                  </button>
                )}

                {selectedPR.status === "inspected" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedPR.id, "sent_to_finance")}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-sm text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ส่งเบิกจ่ายเงิน (งานการเงิน)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Inspection Submission */}
      {showInspectModal && selectedPR && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-modal max-w-md w-full p-6 space-y-4 text-xs text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                บันทึกผลการตรวจรับพัสดุ ({selectedPR.prNumber})
              </h3>
              <button
                type="button"
                onClick={() => setShowInspectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInspectSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">วันที่ตรวจรับพัสดุ</label>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 font-medium focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ผลการตรวจรับ</label>
                <select
                  value={inspectionResult}
                  onChange={(e) => setInspectionResult(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg p-2 font-bold focus:border-blue-900 focus:outline-none"
                >
                  <option value="passed">ผ่านการตรวจรับ (ครบถ้วน ถูกต้องตาม Spec)</option>
                  <option value="failed">ไม่ผ่านการตรวจรับ (ชำรุด / ไม่ตรงตามสัญญา)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ความเห็นคณะกรรมการตรวจรับ</label>
                <textarea
                  rows={3}
                  value={inspectionRemarks}
                  onChange={(e) => setInspectionRemarks(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none leading-relaxed resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInspectModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? "กำลังบันทึก..." : "ยืนยันผลการตรวจรับ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Purchase Requisition */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-modal max-w-2xl w-full p-6 space-y-4 text-xs text-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-900" />
                สร้างแบบขอซื้อ - ขอจ้างใหม่ (New Purchase Requisition)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePR} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ประเภทการจัดหา</label>
                  <select
                    value={procurementType}
                    onChange={(e) => setProcurementType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 font-bold focus:border-blue-900 focus:outline-none"
                  >
                    <option value="purchase">1. ขอซื้อพัสดุ / ครุภัณฑ์ (Purchase)</option>
                    <option value="hire">2. ขอจ้างทำของ / บริการ / เหมาจ่าย (Hire)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">หมวดรายการ</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none font-medium"
                  >
                    <option value="materials">วัสดุสำนักงาน / จัดอบรม (Materials)</option>
                    <option value="equipment">ครุภัณฑ์และเทคโนโลยี (Equipment)</option>
                    <option value="service">จ้างเหมาบริการและซ่อมแซม (Service)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">เพื่อใช้ในโครงการ / งาน</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 font-medium focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสโครงการที่เชื่อมโยง</label>
                  <select
                    value={projectCode}
                    onChange={(e) => setProjectCode(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:border-blue-900 focus:outline-none"
                  >
                    <option value="">-- ไม่ระบุโครงการ / งานส่วนกลาง --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.code}>[{p.code}] {p.title.substring(0, 35)}...</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">แหล่งงบประมาณ</label>
                  <select
                    value={budgetSource}
                    onChange={(e) => setBudgetSource(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  >
                    <option value="faculty_revenue">งบประมาณเงินรายได้คณะ</option>
                    <option value="national_budget">งบประมาณแผ่นดิน (ยุทธศาสตร์)</option>
                    <option value="external">งบประมาณสนับสนุนจากภายนอก</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ผู้ขอซื้อ / ตำแหน่ง</label>
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 font-bold focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สาขาวิชา</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">วันที่ต้องการใช้พัสดุ</label>
                  <input
                    type="date"
                    value={requiredDeliveryDate}
                    onChange={(e) => setRequiredDeliveryDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-amber-700 block mt-0.5 font-medium">
                    * นโยบายการเงิน: ควรยื่นล่วงหน้าอย่างน้อย 10 วันทำการ
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ภาษีมูลค่าเพิ่ม (VAT)</label>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 font-bold focus:border-blue-900 focus:outline-none"
                  >
                    <option value={7}>ภาษีมูลค่าเพิ่ม 7% (ทั่วไป)</option>
                    <option value={0}>ภาษีมูลค่าเพิ่ม 0% (ยกเว้น)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">เหตุผลและความจำเป็น</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">บริษัท/ร้านค้าผู้เสนอราคา</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลขที่ใบเสนอราคา (Quotation)</label>
                  <input
                    type="text"
                    value={quotationNumber}
                    onChange={(e) => setQuotationNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Table in Modal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 text-xs">รายการพัสดุ / ครุภัณฑ์ / คุณลักษณะ:</p>
                  <span className="text-xs font-bold text-blue-900 font-mono">
                    ยอดรวมสุทธิ: {netTotalAmount.toLocaleString()} บาท
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="p-2 text-center w-10">ลำดับ</th>
                        <th className="p-2">รายการพัสดุ</th>
                        <th className="p-2 text-center w-16">จำนวน</th>
                        <th className="p-2 text-center w-16">หน่วย</th>
                        <th className="p-2 text-right w-20">ราคา/หน่วย</th>
                        <th className="p-2 text-right w-24">รวมเงิน</th>
                        <th className="p-2 text-center w-10">ลบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-center text-slate-400">{item.itemNumber}</td>
                          <td className="p-2 font-medium">{item.description}</td>
                          <td className="p-2 text-center font-mono">{item.quantity}</td>
                          <td className="p-2 text-center text-slate-500">{item.unit}</td>
                          <td className="p-2 text-right font-mono">{item.unitPrice.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono font-bold">{item.totalPrice.toLocaleString()}</td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Item Row in Modal */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="ชื่อรายการพัสดุ / ครุภัณฑ์..."
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      className="w-full border rounded-lg p-1.5 bg-white text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="จำนวน"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Number(e.target.value))}
                      className="w-full border rounded-lg p-1.5 bg-white text-center font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="หน่วยนับ"
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      className="w-full border rounded-lg p-1.5 bg-white text-center text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      placeholder="ราคา/หน่วย"
                      value={newItemPrice || ""}
                      onChange={(e) => setNewItemPrice(Number(e.target.value))}
                      className="w-full border rounded-lg p-1.5 bg-white text-right font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm text-xs disabled:opacity-50"
                >
                  {submitting ? "กำลังบันทึก..." : "บันทึกใบขอซื้อ-ขอจ้าง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
