"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wallet, Download, Plus, Search, FileText, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";
import { MOCK_BUDGET_ITEMS } from "@/lib/mockData";
import { exportTableToExcel } from "@/lib/documentGenerator";

export default function FinanceDashboardPage() {
  const [items, setItems] = useState(MOCK_BUDGET_ITEMS);

  const totalAllocated = items.reduce((s, i) => s + i.allocatedAmount, 0);
  const totalCommitted = items.reduce((s, i) => s + i.committedAmount, 0);
  const totalDisbursed = items.reduce((s, i) => s + i.disbursedAmount, 0);
  const totalRemaining = items.reduce((s, i) => s + i.remainingAmount, 0);

  const handleExportExcel = () => {
    const data = items.map((i) => ({
      "หมวดงบประมาณ": i.category,
      "รายการย่อย": i.subCategory,
      "หน่วยงาน/สาขา": i.department,
      "งบจัดสรร (บาท)": i.allocatedAmount,
      "ยอดผูกพัน (บาท)": i.committedAmount,
      "เบิกจ่ายจริง (บาท)": i.disbursedAmount,
      "ยอดคงเหลือ (บาท)": i.remainingAmount,
      "% เบิกจ่าย": `${((i.disbursedAmount / i.allocatedAmount) * 100).toFixed(1)}%`
    }));
    exportTableToExcel(data, "ทะเบียนคุมงบประมาณรายได้_คณะศิลปศาสตร์ฯ_2568", "คุมงบประมาณ");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            ระบบการเงินและงบประมาณ (Finance & Budgeting)
          </h1>
          <p className="text-xs text-slate-500">
            ทะเบียนคุมงบประมาณรายได้ 2568, สัญญายืมเงินทดรองราชการ, และการเบิกจ่ายค่าสอน
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก Excel (.xlsx)</span>
          </button>
          <Link
            href="/finance/loans"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            <Wallet className="w-4 h-4" />
            <span>สัญญายืมเงินทดรอง</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <p className="text-xs text-slate-500">งบประมาณจัดสรรรวม (2568)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalAllocated.toLocaleString()} ฿</p>
          <p className="text-[11px] text-slate-400 mt-0.5">3 หมวดงบประมาณหลัก</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <p className="text-xs text-slate-500">ยอดผูกพันงบประมาณ</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{totalCommitted.toLocaleString()} ฿</p>
          <p className="text-[11px] text-slate-400 mt-0.5">รอส่งหลักฐานเบิกจ่าย</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <p className="text-xs text-slate-500">เบิกจ่ายจริงแล้ว</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{totalDisbursed.toLocaleString()} ฿</p>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
            {((totalDisbursed / totalAllocated) * 100).toFixed(1)}% ของงบรวม
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <p className="text-xs text-slate-500">ยอดคงเหลือที่ใช้ได้</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{totalRemaining.toLocaleString()} ฿</p>
          <p className="text-[11px] text-blue-800 mt-0.5 font-medium">
            {((totalRemaining / totalAllocated) * 100).toFixed(1)}% คงเหลือ
          </p>
        </div>
      </div>

      {/* Budget Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-xs text-slate-900">
            ตารางคุมรายการเงินงบรายได้และงบยุทธศาสตร์ (Budget Ledger)
          </span>
          <span className="text-[11px] text-slate-400">ข้อมูลอ้างอิงไฟล์ คุมรายการเงินงบรายได้ 2568</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">หมวดงบประมาณ</th>
                <th className="py-3 px-4 font-semibold">รายการย่อย</th>
                <th className="py-3 px-4 font-semibold">หน่วยงาน</th>
                <th className="py-3 px-4 font-semibold text-right">งบจัดสรร</th>
                <th className="py-3 px-4 font-semibold text-right">ยอดผูกพัน</th>
                <th className="py-3 px-4 font-semibold text-right">เบิกจ่ายจริง</th>
                <th className="py-3 px-4 font-semibold text-right">ยอดคงเหลือ</th>
                <th className="py-3 px-4 font-semibold text-center">% เบิกจ่าย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((item) => {
                const percent = ((item.disbursedAmount / item.allocatedAmount) * 100).toFixed(1);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.category}</td>
                    <td className="py-3 px-4 text-slate-700">{item.subCategory}</td>
                    <td className="py-3 px-4 text-slate-500">{item.department}</td>
                    <td className="py-3 px-4 font-mono font-medium text-right">{item.allocatedAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-amber-700 text-right">{item.committedAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-emerald-700 text-right font-semibold">{item.disbursedAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-blue-900 font-bold text-right">{item.remainingAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-semibold text-[11px]">
                        {percent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
