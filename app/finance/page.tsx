"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Wallet, 
  Download, 
  Plus, 
  Search, 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle,
  Clock,
  Building,
  Layers,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  X,
  FileCheck,
  Calendar,
  Receipt,
  GraduationCap
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { 
  getBudgetLedger, 
  getLedgerTransactions, 
  createLedgerTransaction, 
  updateBudgetLedgerItem 
} from "@/lib/firebaseService";
import { BudgetLedgerItem, LedgerTransaction } from "@/lib/types";
import { exportTableToExcel } from "@/lib/documentGenerator";

const BUDGET_SOURCE_LABELS: Record<string, string> = {
  faculty_revenue: "งบประมาณเงินรายได้คณะ",
  national_budget: "งบประมาณแผ่นดิน (ยุทธศาสตร์)",
  external: "แหล่งทุนภายนอก"
};

const CATEGORY_LABELS: Record<string, string> = {
  compensation: "1. หมวดค่าตอบแทน",
  operating: "2. หมวดค่าใช้สอย",
  material: "3. หมวดค่าวัสดุ",
  investment: "4. หมวดค่าครุภัณฑ์/ลงทุน",
  general: "งบโครงการทั่วไป"
};

export default function FinanceDashboardPage() {
  const { currentUser, isAdmin, isDean, isFinance } = useRole();
  const [budgetItems, setBudgetItems] = useState<BudgetLedgerItem[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<"ledger" | "transactions">("ledger");
  const [filterYear, setFilterYear] = useState<number>(2569);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for New Transaction
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<LedgerTransaction["transactionType"]>("commitment");
  const [txSource, setTxSource] = useState<LedgerTransaction["budgetSource"]>("faculty_revenue");
  const [txCategory, setTxCategory] = useState<LedgerTransaction["category"]>("operating");
  const [txSubCat, setTxSubCat] = useState("ค่าตอบแทนใช้สอยและวัสดุ (โครงการคณะ)");
  const [txProjectCode, setTxProjectCode] = useState("69-FLAS-001");
  const [txAmount, setTxAmount] = useState<number>(15000);
  const [txRefDoc, setTxRefDoc] = useState("ยม 03/2569");
  const [txDesc, setTxDesc] = useState("ผูกพันงบประมาณการยืมเงินดำเนินโครงการ");
  const [submittingTx, setSubmittingTx] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bData, txData] = await Promise.all([
        getBudgetLedger(),
        getLedgerTransactions()
      ]);
      setBudgetItems(bData);
      setTransactions(txData.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()));
    } catch (err: any) {
      console.error("Error fetching finance data:", err);
      setErrorMsg("ไม่สามารถโหลดข้อมูลงบประมาณได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBudgetItems = budgetItems.filter((i) => {
    const matchesYear = i.fiscalYear === filterYear;
    const matchesSource = filterSource === "all" || i.budgetSource === filterSource;
    const matchesSearch = 
      i.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesYear && matchesSource && matchesSearch;
  });

  const filteredTransactions = transactions.filter((t) => {
    const matchesYear = t.fiscalYear === filterYear;
    const matchesSource = filterSource === "all" || t.budgetSource === filterSource;
    const matchesSearch = 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.referenceDocNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.projectCode && t.projectCode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesYear && matchesSource && matchesSearch;
  });

  const totalAllocated = filteredBudgetItems.reduce((s, i) => s + (Number(i.allocatedAmount) || 0), 0);
  const totalCommitted = filteredBudgetItems.reduce((s, i) => s + (Number(i.committedAmount) || 0), 0);
  const totalDisbursed = filteredBudgetItems.reduce((s, i) => s + (Number(i.disbursedAmount) || 0), 0);
  const totalRemaining = totalAllocated - (totalCommitted + totalDisbursed);
  const percentDisbursed = totalAllocated > 0 ? ((totalDisbursed / totalAllocated) * 100).toFixed(1) : "0";

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDesc.trim() || txAmount <= 0) {
      alert("กรุณากรอกรายละเอียดและจำนวนเงินที่ถูกต้อง");
      return;
    }

    try {
      setSubmittingTx(true);
      const newTx = await createLedgerTransaction({
        fiscalYear: filterYear,
        budgetSource: txSource,
        category: txCategory,
        subCategory: txSubCat,
        projectCode: txProjectCode.trim() || undefined,
        transactionType: txType,
        amount: Number(txAmount),
        referenceDocNumber: txRefDoc.trim(),
        description: txDesc.trim(),
        performedBy: currentUser?.name || "เจ้าหน้าที่การเงิน",
        date: new Date().toISOString().split("T")[0]
      }, currentUser);

      // Adjust matching budget item
      const targetItem = budgetItems.find(b => b.subCategory === txSubCat && b.fiscalYear === filterYear);
      if (targetItem) {
        let newCommitted = targetItem.committedAmount || 0;
        let newDisbursed = targetItem.disbursedAmount || 0;
        let newAllocated = targetItem.allocatedAmount || 0;

        if (txType === "commitment") {
          newCommitted += Number(txAmount);
        } else if (txType === "disbursement") {
          newDisbursed += Number(txAmount);
        } else if (txType === "settlement") {
          newCommitted = Math.max(0, newCommitted - Number(txAmount));
          newDisbursed += Number(txAmount);
        } else if (txType === "allocation") {
          newAllocated += Number(txAmount);
        } else if (txType === "refund") {
          newDisbursed = Math.max(0, newDisbursed - Number(txAmount));
        }

        const newRemaining = newAllocated - (newCommitted + newDisbursed);
        await updateBudgetLedgerItem(targetItem.id, {
          allocatedAmount: newAllocated,
          committedAmount: newCommitted,
          disbursedAmount: newDisbursed,
          remainingAmount: newRemaining
        }, currentUser);
      }

      setShowTxModal(false);
      await fetchData();
    } catch (err: any) {
      console.error("Create transaction error:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกรายการ: " + err.message);
    } finally {
      setSubmittingTx(false);
    }
  };

  const handleExportExcel = () => {
    if (activeTab === "ledger") {
      const data = filteredBudgetItems.map((i) => ({
        "ปีงบประมาณ": i.fiscalYear,
        "แหล่งงบประมาณ": BUDGET_SOURCE_LABELS[i.budgetSource] || i.budgetSource,
        "หมวดงบประมาณ": CATEGORY_LABELS[i.category] || i.category,
        "รายการย่อย": i.subCategory,
        "หน่วยงาน/สาขา": i.department,
        "งบจัดสรร (บาท)": i.allocatedAmount,
        "ยอดผูกพัน (บาท)": i.committedAmount,
        "เบิกจ่ายจริง (บาท)": i.disbursedAmount,
        "ยอดคงเหลือ (บาท)": i.allocatedAmount - (i.committedAmount + i.disbursedAmount),
        "% เบิกจ่าย": `${((i.disbursedAmount / (i.allocatedAmount || 1)) * 100).toFixed(1)}%`
      }));
      exportTableToExcel(data, `ทะเบียนคุมงบประมาณ_${filterYear}`, "คุมงบประมาณ");
    } else {
      const data = filteredTransactions.map((t) => ({
        "เลขที่รายการ": t.transactionNumber,
        "วันที่": t.date,
        "ประเภทรายการ": t.transactionType === "allocation" ? "จัดสรรงบ" : t.transactionType === "commitment" ? "ผูกพันงบ" : t.transactionType === "disbursement" ? "เบิกจ่ายจริง" : t.transactionType === "settlement" ? "ส่งใช้เงินยืม" : "คืนเงิน/ปรับปรุง",
        "แหล่งงบ": BUDGET_SOURCE_LABELS[t.budgetSource] || t.budgetSource,
        "รายการงบประมาณ": t.subCategory,
        "รหัสโครงการ": t.projectCode || "-",
        "เลขที่เอกสารอ้างอิง": t.referenceDocNumber,
        "รายละเอียด": t.description,
        "จำนวนเงิน (บาท)": t.amount,
        "ผู้บันทึก": t.performedBy
      }));
      exportTableToExcel(data, `บัญชีแยกประเภทรายการเงิน_${filterYear}`, "รายการเคลื่อนไหว");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              ระบบการเงินและงบประมาณ (Finance & Budget Ledger)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
              ปีงบประมาณ {filterYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ทะเบียนคุมงบประมาณรายได้-แผ่นดิน บันทึกผูกพัน ตัดจ่าย สัญญายืมเงิน และเบิกจ่ายค่าสอน
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
            onClick={() => setShowTxModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>บันทึกรายการเคลื่อนไหว</span>
          </button>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/finance/loans"
          className="p-4 bg-white border border-slate-200 hover:border-blue-900 rounded-2xl shadow-subtle transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-all">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">สัญญายืมเงินทดรอง (แบบ 8500)</p>
              <p className="text-[11px] text-slate-500">ออกสัญญา ตรวจเช็คลิสต์ และส่งใช้คืน</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900" />
        </Link>

        <Link
          href="/finance/disbursement"
          className="p-4 bg-white border border-slate-200 hover:border-blue-900 rounded-2xl shadow-subtle transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-all">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">เบิกจ่ายค่าสอนและค่านิเทศ</p>
              <p className="text-[11px] text-slate-500">คำนวณชั่วโมง รายวิชา หักภาษี และส่งออก Word</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900" />
        </Link>

        <Link
          href="/admin/checklists"
          className="p-4 bg-white border border-slate-200 hover:border-blue-900 rounded-2xl shadow-subtle transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-all">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">เช็คลิสต์ตรวจเอกสารการเงิน</p>
              <p className="text-[11px] text-slate-500">12 รายการตรวจรับรองตามระเบียบ CPRU</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900" />
        </Link>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">งบประมาณจัดสรรรวม ({filterYear})</p>
            <Layers className="w-4 h-4 text-blue-900" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">{totalAllocated.toLocaleString()} ฿</p>
          <p className="text-[11px] text-slate-400 mt-1">{filteredBudgetItems.length} หมวดรายการจัดสรร</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">ยอดผูกพันงบประมาณ (Committed)</p>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2 font-mono">{totalCommitted.toLocaleString()} ฿</p>
          <p className="text-[11px] text-slate-400 mt-1">สัญญายืมเงินและใบขอซื้อที่อยู่ระหว่างดำเนินการ</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">เบิกจ่ายจริงแล้ว (Disbursed)</p>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2 font-mono">{totalDisbursed.toLocaleString()} ฿</p>
          <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
            {percentDisbursed}% ของงบประมาณจัดสรร
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">ยอดคงเหลือที่ใช้ได้จริง (Available)</p>
            <DollarSign className="w-4 h-4 text-blue-900" />
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-2 font-mono">{totalRemaining.toLocaleString()} ฿</p>
          <p className="text-[11px] text-blue-800 mt-1 font-semibold">
            {totalAllocated > 0 ? ((totalRemaining / totalAllocated) * 100).toFixed(1) : 0}% คงเหลือ
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        {/* Navigation Tabs & Search Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("ledger")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "ledger"
                  ? "bg-blue-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              ทะเบียนคุมงบประมาณ (Budget Ledger)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "transactions"
                  ? "bg-blue-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>รายการเคลื่อนไหว (Transactions)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "transactions" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                {filteredTransactions.length}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="border border-slate-200 rounded-lg p-2 bg-white font-bold text-slate-800 focus:border-blue-900 focus:outline-none"
            >
              <option value={2569}>ปีงบประมาณ 2569</option>
              <option value={2568}>ปีงบประมาณ 2568</option>
            </select>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="border border-slate-200 rounded-lg p-2 bg-white text-slate-700 focus:border-blue-900 focus:outline-none"
            >
              <option value="all">ทุกแหล่งงบประมาณ</option>
              <option value="faculty_revenue">งบเงินรายได้คณะ</option>
              <option value="national_budget">งบแผ่นดิน (ยุทธศาสตร์)</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหารายการ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:border-blue-900 focus:outline-none text-xs w-48"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Budget Ledger Table */}
        {activeTab === "ledger" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-3 w-12 text-center">ลำดับ</th>
                  <th className="p-3">หมวดงบประมาณ / รายการย่อย</th>
                  <th className="p-3">แหล่งงบ / หน่วยงาน</th>
                  <th className="p-3 text-right">งบจัดสรร (บาท)</th>
                  <th className="p-3 text-right text-amber-700">ผูกพัน (บาท)</th>
                  <th className="p-3 text-right text-emerald-700">เบิกจ่ายจริง (บาท)</th>
                  <th className="p-3 text-right text-blue-900">คงเหลือสุทธิ (บาท)</th>
                  <th className="p-3 text-center w-24">% เบิกจ่าย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBudgetItems.map((item, idx) => {
                  const rem = item.allocatedAmount - ((item.committedAmount || 0) + (item.disbursedAmount || 0));
                  const pct = item.allocatedAmount > 0 ? ((item.disbursedAmount / item.allocatedAmount) * 100).toFixed(1) : "0";
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{item.subCategory}</span>
                        <span className="text-[11px] text-slate-500">{CATEGORY_LABELS[item.category] || item.category}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-slate-700 block">{BUDGET_SOURCE_LABELS[item.budgetSource] || item.budgetSource}</span>
                        <span className="text-[11px] text-slate-400">{item.department}</span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">
                        {item.allocatedAmount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-amber-700 font-mono">
                        {(item.committedAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700 font-mono">
                        {(item.disbursedAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-extrabold text-blue-900 font-mono">
                        {rem.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1 overflow-hidden">
                          <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, Number(pct))}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                  <td colSpan={3} className="p-3 text-right">รวมทั้งสิ้น:</td>
                  <td className="p-3 text-right font-mono text-sm">{totalAllocated.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-sm text-amber-700">{totalCommitted.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-sm text-emerald-700">{totalDisbursed.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-sm text-blue-900">{totalRemaining.toLocaleString()}</td>
                  <td className="p-3 text-center text-xs font-mono">{percentDisbursed}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Tab 2: Transactions History Table */}
        {activeTab === "transactions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-3 w-12 text-center">ลำดับ</th>
                  <th className="p-3">เลขที่ / วันที่</th>
                  <th className="p-3">ประเภทรายการ</th>
                  <th className="p-3">หมวดงบ / รายละเอียด</th>
                  <th className="p-3">รหัสโครงการ / เอกสารอ้างอิง</th>
                  <th className="p-3 text-right">จำนวนเงิน (บาท)</th>
                  <th className="p-3">ผู้บันทึก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx, idx) => {
                  const typeBadge = 
                    tx.transactionType === "commitment" ? "bg-amber-50 text-amber-900 border-amber-200" :
                    tx.transactionType === "disbursement" ? "bg-emerald-50 text-emerald-900 border-emerald-200" :
                    tx.transactionType === "settlement" ? "bg-blue-50 text-blue-900 border-blue-200" :
                    tx.transactionType === "allocation" ? "bg-purple-50 text-purple-900 border-purple-200" : "bg-slate-100 text-slate-800 border-slate-200";
                  
                  const typeLabel = 
                    tx.transactionType === "commitment" ? "ผูกพันงบ" :
                    tx.transactionType === "disbursement" ? "เบิกจ่ายจริง" :
                    tx.transactionType === "settlement" ? "ส่งใช้เงินยืม" :
                    tx.transactionType === "allocation" ? "จัดสรรงบ" : "ปรับปรุงยอด";

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-900 block">{tx.transactionNumber}</span>
                        <span className="text-[11px] text-slate-400">{tx.date}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${typeBadge}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{tx.description}</span>
                        <span className="text-[11px] text-slate-500">{tx.subCategory}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono font-semibold text-blue-900 block">{tx.projectCode || "-"}</span>
                        <span className="text-[11px] text-slate-500">{tx.referenceDocNumber}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-sm text-slate-900">
                        {tx.amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-slate-600">{tx.performedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: New Ledger Transaction */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-modal max-w-lg w-full p-6 space-y-4 text-xs text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-900" />
                บันทึกรายการเคลื่อนไหวงบประมาณ (New Transaction)
              </h3>
              <button
                type="button"
                onClick={() => setShowTxModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ประเภทรายการ</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 font-bold focus:border-blue-900 focus:outline-none"
                  >
                    <option value="commitment">1. ผูกพันงบประมาณ (Commitment)</option>
                    <option value="disbursement">2. เบิกจ่ายเงินจริง (Disbursement)</option>
                    <option value="settlement">3. ส่งใช้เงินยืม/ตัดจ่าย (Settlement)</option>
                    <option value="allocation">4. เพิ่มวงเงินจัดสรร (Allocation)</option>
                    <option value="refund">5. คืนเงินงบประมาณ (Refund)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">แหล่งงบประมาณ</label>
                  <select
                    value={txSource}
                    onChange={(e) => setTxSource(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  >
                    <option value="faculty_revenue">งบเงินรายได้คณะ</option>
                    <option value="national_budget">งบแผ่นดิน (ยุทธศาสตร์)</option>
                    <option value="external">แหล่งทุนภายนอก</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมวดรายการงบประมาณ</label>
                <select
                  value={txSubCat}
                  onChange={(e) => setTxSubCat(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 font-medium focus:border-blue-900 focus:outline-none"
                >
                  {budgetItems.filter(b => b.fiscalYear === filterYear).map((b) => (
                    <option key={b.id} value={b.subCategory}>
                      {b.subCategory} ({BUDGET_SOURCE_LABELS[b.budgetSource]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสโครงการ (ถ้ามี)</label>
                  <input
                    type="text"
                    value={txProjectCode}
                    onChange={(e) => setTxProjectCode(e.target.value)}
                    placeholder="เช่น 69-FLAS-001"
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลขที่เอกสารอ้างอิง</label>
                  <input
                    type="text"
                    value={txRefDoc}
                    onChange={(e) => setTxRefDoc(e.target.value)}
                    placeholder="เช่น ยม 02/2569, บจ 01/2569"
                    className="w-full border border-slate-200 rounded-lg p-2 font-medium focus:border-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">คำอธิบายรายการ</label>
                <input
                  type="text"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="ระบุวัตถุประสงค์การใช้จ่าย..."
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  value={txAmount || ""}
                  onChange={(e) => setTxAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-bold font-mono text-base text-blue-900 focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingTx}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingTx ? "กำลังบันทึก..." : "บันทึกรายการ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
