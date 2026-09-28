"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Wallet, 
  Plus, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Building,
  DollarSign,
  FileText,
  FileCheck,
  Receipt,
  Search,
  Check,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { 
  getFinanceLoans, 
  createFinanceLoan, 
  updateFinanceLoanStatus, 
  settleFinanceLoan,
  getProjects 
} from "@/lib/firebaseService";
import { LoanContract, ProjectProposal } from "@/lib/types";
import { exportTableToExcel, exportLoanContractToWord, printDocumentView } from "@/lib/documentGenerator";

// Helper function to convert number to Thai Baht text
function thaiBahtText(num: number): string {
  if (isNaN(num) || num === 0) return "ศูนย์บาทถ้วน";
  const thaiNums = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const thaiPlaces = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  
  let strNum = Math.floor(num).toString();
  let result = "";
  const len = strNum.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(strNum[i], 10);
    const place = len - i - 1;

    if (digit !== 0) {
      if (place === 1 && digit === 1) {
        result += "สิบ";
      } else if (place === 1 && digit === 2) {
        result += "ยี่สิบ";
      } else if (place === 0 && digit === 1 && len > 1) {
        result += "เอ็ด";
      } else {
        result += thaiNums[digit] + thaiPlaces[place];
      }
    }
  }

  return result + "บาทถ้วน";
}

export default function LoanContractsPage() {
  const { currentUser, isAdmin, isDean, isFinance } = useRole();
  const [loans, setLoans] = useState<LoanContract[]>([]);
  const [projects, setProjects] = useState<ProjectProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanContract | null>(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Loan Form State
  const [borrowerName, setBorrowerName] = useState(currentUser?.name || "อ.ฤทธิชัย ภาระวิเศษ");
  const [position, setPosition] = useState("อาจารย์ประจำสาขาวิชารัฐศาสตร์");
  const [department, setDepartment] = useState(currentUser?.department || "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์");
  const [purpose, setPurpose] = useState("โครงการพัฒนาทักษะวิชาชีพและการประยุกต์ใช้ AI เพื่อการตัดสินใจเชิงนโยบาย");
  const [projectCode, setProjectCode] = useState("69-FLAS-001");
  const [amount, setAmount] = useState<number>(35000);
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().split("T")[0]);
  const [settleDueDate, setSettleDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [estimatedExpenses, setEstimatedExpenses] = useState([
    { category: "ค่าตอบแทน", description: "ค่าตอบแทนวิทยากร (12 ชม.)", amount: 12000 },
    { category: "ค่าใช้สอย", description: "ค่าอาหารและอาหารว่างผู้เข้าร่วม 50 คน", amount: 18000 },
    { category: "ค่าวัสดุ", description: "ค่าวัสดุและเอกสารจัดอบรม", amount: 5000 }
  ]);
  const [checklist, setChecklist] = useState({
    hasContract: true,
    hasMemo: true,
    hasApprovedProject: true,
    hasEstimate: true
  });

  // Settlement Form State
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [voucherAmount, setVoucherAmount] = useState<number>(0);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [voucherSummary, setVoucherSummary] = useState("");
  const [settleRemark, setSettleRemark] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [loanData, projData] = await Promise.all([
        getFinanceLoans(),
        getProjects()
      ]);
      setLoans(loanData.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()));
      setProjects(projData);
    } catch (err: any) {
      console.error("Error fetching loans:", err);
      setErrorMsg("ไม่สามารถโหลดทะเบียนสัญญายืมเงินได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLoans = loans.filter((l) => {
    const matchesSearch = 
      l.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.projectCode && l.projectCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === "all" || l.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalActiveLoanAmount = loans
    .filter(l => l.status === "disbursed" || l.status === "partially_settled")
    .reduce((sum, l) => sum + (l.remainingBalance !== undefined ? l.remainingBalance : l.amount), 0);

  const totalSettledAmount = loans
    .reduce((sum, l) => sum + (l.totalSettledAmount || (l.status === "settled" ? l.amount : 0)), 0);

  const overdueLoansCount = loans.filter(l => {
    if (l.status === "settled" || l.status === "cancelled" || l.status === "draft") return false;
    return new Date(l.settleDueDate).getTime() < Date.now();
  }).length;

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim() || !purpose.trim() || amount <= 0) {
      alert("กรุณากรอกข้อมูลผู้ยืม วัตถุประสงค์ และจำนวนเงินให้ครบถ้วน");
      return;
    }

    try {
      setSubmitting(true);
      const created = await createFinanceLoan({
        borrowerName: borrowerName.trim(),
        position: position.trim(),
        department: department.trim(),
        purpose: purpose.trim(),
        projectCode: projectCode.trim() || undefined,
        amount: Number(amount),
        bahtText: thaiBahtText(Number(amount)),
        estimatedExpenses,
        borrowDate,
        settleDueDate,
        status: "submitted",
        checklist,
        approverName: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี",
        approverPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์"
      }, currentUser);

      setShowAddModal(false);
      await fetchData();
    } catch (err: any) {
      console.error("Create loan error:", err);
      alert("เกิดข้อผิดพลาดในการสร้างสัญญายืมเงิน: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveLoan = async (loanId: string) => {
    try {
      await updateFinanceLoanStatus(loanId, "approved", {
        approverName: currentUser?.name || "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี",
        approverPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์"
      }, currentUser);
      await fetchData();
      if (selectedLoan && selectedLoan.id === loanId) {
        setSelectedLoan({ ...selectedLoan, status: "approved" });
      }
    } catch (err: any) {
      alert("ไม่สามารถอนุมัติสัญญาได้: " + err.message);
    }
  };

  const handleDisburseLoan = async (loanId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      await updateFinanceLoanStatus(loanId, "disbursed", {
        disbursedDate: today,
        disbursedAmount: selectedLoan?.amount || 0,
        settleDueDate: dueDate,
        remainingBalance: selectedLoan?.amount || 0
      }, currentUser);
      await fetchData();
      if (selectedLoan && selectedLoan.id === loanId) {
        setSelectedLoan({ 
          ...selectedLoan, 
          status: "disbursed", 
          disbursedDate: today, 
          settleDueDate: dueDate, 
          remainingBalance: selectedLoan.amount 
        });
      }
    } catch (err: any) {
      alert("ไม่สามารถจ่ายเงินยืมได้: " + err.message);
    }
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    const totalSettle = Number(cashAmount) + Number(voucherAmount);
    if (totalSettle <= 0) {
      alert("กรุณาระบุจำนวนเงินสดหรือยอดใบสำคัญคู่จ่ายที่ส่งใช้");
      return;
    }

    try {
      setSubmitting(true);
      const updated = await settleFinanceLoan(selectedLoan.id, {
        cashAmount: Number(cashAmount),
        voucherAmount: Number(voucherAmount),
        receiptNumber: receiptNumber.trim() || undefined,
        voucherSummary: voucherSummary.trim() || "ส่งใช้เงินยืมโครงการ",
        receivedBy: currentUser?.name || "เจ้าหน้าที่การเงิน",
        remark: settleRemark.trim() || undefined
      }, currentUser);

      setSelectedLoan(updated);
      setShowSettleModal(false);
      setCashAmount(0);
      setVoucherAmount(0);
      setReceiptNumber("");
      setVoucherSummary("");
      setSettleRemark("");
      await fetchData();
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการบันทึกส่งใช้เงินยืม: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    const data = filteredLoans.map((l) => ({
      "สัญญาเลขที่": l.contractNumber,
      "ผู้ยืมเงิน": l.borrowerName,
      "ตำแหน่ง": l.position,
      "สาขาวิชา": l.department,
      "รหัสโครงการ": l.projectCode || "-",
      "ยืมเพื่อโครงการ/งาน": l.purpose,
      "จำนวนเงินยืม (บาท)": l.amount,
      "ยอดส่งใช้แล้ว (บาท)": l.totalSettledAmount || 0,
      "ยอดคงค้าง (บาท)": l.remainingBalance !== undefined ? l.remainingBalance : l.amount,
      "วันที่ยืม": l.borrowDate,
      "วันที่จ่ายเงิน": l.disbursedDate || "-",
      "กำหนดส่งใช้คืน": l.settleDueDate,
      "สถานะ": l.status === "settled" ? "ส่งใช้คืนครบแล้ว" :
               l.status === "partially_settled" ? "ส่งใช้บางส่วน" :
               l.status === "disbursed" ? "อยู่ระหว่างยืม (จ่ายเงินแล้ว)" :
               l.status === "approved" ? "อนุมัติแล้ว (รอจ่ายเงิน)" : "รออนุมัติ"
    }));
    exportTableToExcel(data, `ทะเบียนสัญญายืมเงินทดรอง_2569`, "สัญญายืมเงิน");
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link href="/finance" className="text-xs text-blue-900 hover:underline flex items-center gap-1 font-semibold mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปหน้ารวมการเงิน
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">
              สัญญายืมเงินทดรองราชการ (Advance Cash Loans — Form 8500)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
              แบบ 8500 ฉบับปรับปรุง 2569
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ออกสัญญายืมเงินเพื่อดำเนินโครงการ ตรวจสอบเช็คลิสต์ 4 รายการ อนุมัติ จ่ายเงิน และส่งใช้คืนหลายงวด
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>ส่งออก Excel</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างสัญญายืมเงิน</span>
          </button>
        </div>
      </div>

      {/* 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">ยอดเงินยืมที่อยู่ระหว่างดำเนินงาน</p>
            <Wallet className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2 font-mono">
            {totalActiveLoanAmount.toLocaleString()} ฿
          </p>
          <p className="text-[11px] text-slate-400 mt-1">ยอดเงินคงค้างที่ผู้ยืมต้องนำส่งใช้คืน</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">ยอดส่งใช้คืนสะสมเรียบร้อย</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
            {totalSettledAmount.toLocaleString()} ฿
          </p>
          <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
            เงินสดและใบสำคัญคู่จ่ายที่ตัดจ่ายแล้ว
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">สัญญาที่เกินกำหนดส่งใช้ (30 วัน)</p>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2 font-mono">
            {overdueLoansCount} ฉบับ
          </p>
          <p className="text-[11px] text-rose-500 mt-1 font-semibold">
            {overdueLoansCount > 0 ? "ต้องเร่งรัดติดตามใบสำคัญคู่จ่าย" : "ไม่มีสัญญาเกินกำหนด"}
          </p>
        </div>
      </div>

      {/* Table & Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-lg p-2 bg-white text-xs font-semibold focus:border-blue-900 focus:outline-none"
            >
              <option value="all">สถานะสัญญาทั้งหมด</option>
              <option value="submitted">รออนุมัติสัญญา (Submitted)</option>
              <option value="approved">อนุมัติแล้ว (รอจ่ายเงิน)</option>
              <option value="disbursed">จ่ายเงินแล้ว / ระหว่างยืม</option>
              <option value="partially_settled">ส่งใช้คืนบางส่วน</option>
              <option value="settled">ส่งใช้คืนครบแล้ว (ปิดหนี้)</option>
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาเลขสัญญา ผู้ยืม โครงการ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:border-blue-900 focus:outline-none text-xs w-64"
            />
          </div>
        </div>

        {/* Loans Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3 w-12 text-center">ลำดับ</th>
                <th className="p-3">สัญญาเลขที่</th>
                <th className="p-3">ผู้ยืมเงิน / สาขาวิชา</th>
                <th className="p-3">โครงการ / วัตถุประสงค์</th>
                <th className="p-3 text-right">วงเงินยืม (บาท)</th>
                <th className="p-3 text-right">คงค้าง (บาท)</th>
                <th className="p-3 text-center">กำหนดส่งใช้</th>
                <th className="p-3 text-center">สถานะ</th>
                <th className="p-3 text-center w-24">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.map((l, idx) => {
                const isOverdue = l.status !== "settled" && l.status !== "cancelled" && new Date(l.settleDueDate).getTime() < Date.now();
                const remaining = l.remainingBalance !== undefined ? l.remainingBalance : l.amount;

                const statusBadge = 
                  l.status === "settled" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                  l.status === "partially_settled" ? "bg-blue-50 text-blue-900 border-blue-200" :
                  l.status === "disbursed" ? "bg-amber-50 text-amber-900 border-amber-200" :
                  l.status === "approved" ? "bg-purple-50 text-purple-900 border-purple-200" : "bg-slate-100 text-slate-700 border-slate-200";

                const statusText = 
                  l.status === "settled" ? "ส่งใช้ครบแล้ว" :
                  l.status === "partially_settled" ? "ส่งใช้บางส่วน" :
                  l.status === "disbursed" ? "รับเงินแล้ว (รอส่งใช้)" :
                  l.status === "approved" ? "อนุมัติแล้ว (รอจ่ายเงิน)" : "รออนุมัติ";

                return (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-blue-900 block">{l.contractNumber}</span>
                      <span className="text-[11px] text-slate-400">{l.borrowDate}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{l.borrowerName}</span>
                      <span className="text-[11px] text-slate-500">{l.department}</span>
                    </td>
                    <td className="p-3 max-w-xs">
                      <span className="font-medium text-slate-900 block truncate">{l.purpose}</span>
                      {l.projectCode && (
                        <span className="text-[10px] font-mono font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {l.projectCode}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {l.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-amber-700">
                      {remaining.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`block font-medium ${isOverdue ? "text-rose-600 font-bold" : "text-slate-600"}`}>
                        {l.settleDueDate}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] text-rose-600 bg-rose-50 px-1 rounded font-bold">
                          เกินกำหนด 30 วัน
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${statusBadge}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedLoan(l)}
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

      {/* Modal: View Loan Details & Actions */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-modal max-w-2xl w-full p-6 space-y-5 text-xs text-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedLoan.contractNumber}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  สัญญาการยืมเงินทดรองราชการ (แบบ 8500)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLoan(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Loan Summary Block */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-[11px] text-slate-500 block">ผู้ยืมเงิน:</span>
                <span className="font-bold text-slate-900">{selectedLoan.borrowerName} ({selectedLoan.position})</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">สาขาวิชา/หน่วยงาน:</span>
                <span className="font-bold text-slate-900">{selectedLoan.department}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">จำนวนเงินยืม:</span>
                <span className="font-bold font-mono text-sm text-blue-900">{selectedLoan.amount.toLocaleString()} บาท</span>
                <span className="text-[11px] text-slate-500 block">({selectedLoan.bahtText || thaiBahtText(selectedLoan.amount)})</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">ยอดคงค้างชำระ:</span>
                <span className="font-bold font-mono text-sm text-amber-700">
                  {(selectedLoan.remainingBalance !== undefined ? selectedLoan.remainingBalance : selectedLoan.amount).toLocaleString()} บาท
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[11px] text-slate-500 block">วัตถุประสงค์การยืม:</span>
                <span className="font-medium text-slate-800">{selectedLoan.purpose}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">วันที่ทำสัญญา:</span>
                <span className="font-medium text-slate-800">{selectedLoan.borrowDate}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">กำหนดส่งใช้คืน (30 วัน):</span>
                <span className="font-bold text-slate-900">{selectedLoan.settleDueDate}</span>
              </div>
            </div>

            {/* Expense Breakdown Table */}
            {selectedLoan.estimatedExpenses && selectedLoan.estimatedExpenses.length > 0 && (
              <div>
                <p className="font-bold text-slate-900 mb-1.5">ประมาณการค่าใช้จ่ายในโครงการ:</p>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2 text-center w-10">ลำดับ</th>
                        <th className="p-2 w-24">หมวด</th>
                        <th className="p-2">รายละเอียด</th>
                        <th className="p-2 text-right w-24">จำนวนเงิน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedLoan.estimatedExpenses.map((exp, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-semibold">{exp.category}</td>
                          <td className="p-2">{exp.description}</td>
                          <td className="p-2 text-right font-mono font-bold">{exp.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settlements History */}
            <div>
              <p className="font-bold text-slate-900 mb-1.5">ประวัติการส่งใช้คืนเงินยืม:</p>
              {(!selectedLoan.settlements || selectedLoan.settlements.length === 0) ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-center">
                  ยังไม่มีประวัติการส่งใช้เงินยืมสำหรับสัญญานี้
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2">วันที่ส่งใช้</th>
                        <th className="p-2 text-right">เงินสด (บาท)</th>
                        <th className="p-2 text-right">ใบสำคัญ (บาท)</th>
                        <th className="p-2">เลขที่ใบเสร็จ/รายการ</th>
                        <th className="p-2 text-right">คงเหลือสุทธิ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedLoan.settlements.map((stl) => (
                        <tr key={stl.id}>
                          <td className="p-2">{stl.settleDate}</td>
                          <td className="p-2 text-right font-mono">{stl.cashAmount.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono">{stl.voucherAmount.toLocaleString()}</td>
                          <td className="p-2">{stl.receiptNumber || "-"} ({stl.voucherSummary || "ส่งใช้"})</td>
                          <td className="p-2 text-right font-mono font-bold text-amber-700">{stl.remainingBalance.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportLoanContractToWord(selectedLoan)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200"
                >
                  <Download className="w-4 h-4" />
                  <span>ส่งออก Word (แบบ 8500)</span>
                </button>
                <button
                  type="button"
                  onClick={printDocumentView}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์ / PDF</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedLoan.status === "submitted" && (
                  <button
                    type="button"
                    onClick={() => handleApproveLoan(selectedLoan.id)}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-sm text-xs"
                  >
                    อนุมัติสัญญาเงินยืม
                  </button>
                )}

                {selectedLoan.status === "approved" && (
                  <button
                    type="button"
                    onClick={() => handleDisburseLoan(selectedLoan.id)}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-sm text-xs"
                  >
                    บันทึกจ่ายเงินยืมให้ผู้ยืม
                  </button>
                )}

                {(selectedLoan.status === "disbursed" || selectedLoan.status === "partially_settled") && (
                  <button
                    type="button"
                    onClick={() => setShowSettleModal(true)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-sm text-xs flex items-center gap-1.5"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>บันทึกส่งใช้คืนเงินยืม</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Settlement (Partial / Full) */}
      {showSettleModal && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-modal max-w-md w-full p-6 space-y-4 text-xs text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                บันทึกการส่งใช้คืนเงินยืม ({selectedLoan.contractNumber})
              </h3>
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <span className="text-amber-900 font-semibold">ยอดคงค้างปัจจุบัน:</span>
                <span className="font-mono font-bold text-base text-amber-900">
                  {(selectedLoan.remainingBalance !== undefined ? selectedLoan.remainingBalance : selectedLoan.amount).toLocaleString()} บาท
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">1. จำนวนเงินสดส่งคืน (บาท)</label>
                <input
                  type="number"
                  value={cashAmount || ""}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-bold font-mono focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">2. ยอดตามใบสำคัญคู่จ่าย (บาท)</label>
                <input
                  type="number"
                  value={voucherAmount || ""}
                  onChange={(e) => setVoucherAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-bold font-mono focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เลขที่ใบเสร็จรับเงิน (ถ้ามี)</label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="เช่น บส. 69/045"
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">สรุปรายการใบสำคัญคู่จ่าย</label>
                <input
                  type="text"
                  value={voucherSummary}
                  onChange={(e) => setVoucherSummary(e.target.value)}
                  placeholder="เช่น ใบสำคัญจ่ายค่าวิทยากรและค่าอาหารกลางวัน"
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  value={settleRemark}
                  onChange={(e) => setSettleRemark(e.target.value)}
                  placeholder="เช่น ส่งใช้เงินยืมงวดที่ 1"
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? "กำลังบันทึก..." : "ยืนยันส่งใช้เงินยืม"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Loan Contract */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-modal max-w-xl w-full p-6 space-y-4 text-xs text-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-900" />
                ออกสัญญายืมเงินทดรองราชการ (แบบ 8500)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อผู้ขอยืมเงิน</label>
                  <input
                    type="text"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 font-bold focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">สาขาวิชา / หน่วยงาน</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">ยืมเพื่อใช้ในการดำเนินงาน / โครงการ</label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
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
                    <option value="">-- ไม่ระบุ / เงินยืมทั่วไป --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.code}>[{p.code}] {p.title.substring(0, 35)}...</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">จำนวนเงินที่ขอยืม (บาท)</label>
                  <input
                    type="number"
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 font-bold font-mono text-blue-900 focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">วันที่ทำสัญญา</label>
                  <input
                    type="date"
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">กำหนดส่งใช้คืน (30 วัน)</label>
                  <input
                    type="date"
                    value={settleDueDate}
                    onChange={(e) => setSettleDueDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 font-bold text-slate-900 focus:border-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Checklist verification */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="font-bold text-slate-900 text-[11px]">เช็คลิสต์เอกสารประกอบสัญญายืมเงิน:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.hasContract}
                      onChange={(e) => setChecklist({ ...checklist, hasContract: e.target.checked })}
                      className="rounded text-blue-900 focus:ring-blue-900"
                    />
                    <span>สัญญาการยืมเงิน (แบบ 8500) 2 ฉบับ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.hasMemo}
                      onChange={(e) => setChecklist({ ...checklist, hasMemo: e.target.checked })}
                      className="rounded text-blue-900 focus:ring-blue-900"
                    />
                    <span>บันทึกข้อความขออนุมัติยืมเงิน</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.hasApprovedProject}
                      onChange={(e) => setChecklist({ ...checklist, hasApprovedProject: e.target.checked })}
                      className="rounded text-blue-900 focus:ring-blue-900"
                    />
                    <span>โครงการที่ได้รับอนุมัติแล้ว</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.hasEstimate}
                      onChange={(e) => setChecklist({ ...checklist, hasEstimate: e.target.checked })}
                      className="rounded text-blue-900 focus:ring-blue-900"
                    />
                    <span>ประมาณการค่าใช้จ่ายโดยละเอียด</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? "กำลังบันทึก..." : "บันทึกสัญญายืมเงิน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
