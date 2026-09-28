"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Package, Plus, Download, Printer, Trash2, CheckCircle2, FileText } from "lucide-react";
import { MOCK_PURCHASE_REQ } from "@/lib/mockData";
import { PurchaseRequisition } from "@/lib/types";
import { exportPurchaseRequisitionExcel, printDocumentView } from "@/lib/documentGenerator";

export default function ProcurementPage() {
  const [reqs, setReqs] = useState<PurchaseRequisition[]>(MOCK_PURCHASE_REQ);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form for new purchase request
  const [prNumber, setPrNumber] = useState(`พด. 01${reqs.length + 5}/2569`);
  const [projectName, setProjectName] = useState("โครงการพัฒนาศักยภาพนักศึกษาและเสริมสร้างทักษะวิชาชีพ");
  const [requesterName, setRequesterName] = useState("อ.ฤทธิชัย ภาระวิเศษ");
  const [department, setDepartment] = useState("สาขาวิชารัฐศาสตร์");
  const [budgetSource, setBudgetSource] = useState("งบประมาณรายได้คณะ ประจำปี 2569");
  
  const [items, setItems] = useState([
    { itemNumber: 1, description: "กระดาษ A4 80 แกรม (Double A)", quantity: 15, unit: "รีม", unitPrice: 145, totalPrice: 2175 },
    { itemNumber: 2, description: "หมึกเครื่องพิมพ์ HP Laser Toner", quantity: 2, unit: "ตลับ", unitPrice: 3800, totalPrice: 7600 },
    { itemNumber: 3, description: "อาหารว่างและเครื่องดื่มจัดอบรม (50 คน)", quantity: 50, unit: "ชุด", unitPrice: 50, totalPrice: 2500 }
  ]);

  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("ชุด");
  const [newItemPrice, setNewItemPrice] = useState(0);

  const subTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const vat = subTotal * 0.07;
  const netTotal = subTotal + vat;

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

  const handleExportExcel = () => {
    exportPurchaseRequisitionExcel({
      prNumber,
      projectName,
      requesterName,
      department,
      requestDate: new Date().toISOString().split("T")[0],
      items
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            ระบบพัสดุและจัดซื้อจัดจ้าง (Procurement & Purchasing)
          </h1>
          <p className="text-xs text-slate-500">
            สร้างใบขอซื้อ-ขอจ้าง คำนวณ VAT 7% อัตโนมัติ และส่งออกเป็น Excel (.xlsx) และ Word
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={printDocumentView}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Excel ใบขอซื้อ (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Main Requisition Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-card space-y-6 text-xs text-slate-800">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            แบบกรอกการขอซื้อ - ขอจ้าง (อ้างอิงไฟล์แบบฟอร์มคณะ)
          </h2>
          <span className="font-mono font-bold text-blue-900">{prNumber}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">เลขที่ขอซื้อ-ขอจ้าง</label>
            <input
              type="text"
              value={prNumber}
              onChange={(e) => setPrNumber(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 font-mono focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">แหล่งงบประมาณ</label>
            <input
              type="text"
              value={budgetSource}
              onChange={(e) => setBudgetSource(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">เพื่อใช้ในโครงการ / งาน</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ผู้ขอซื้อ</label>
              <input
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">สาขาวิชา</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-3">
          <label className="block font-semibold text-slate-700">
            รายการพัสดุ / ครุภัณฑ์ / จ้างเหมา
          </label>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-2.5 px-3">รายการพัสดุ / รายละเอียด</th>
                  <th className="py-2.5 px-3 w-20 text-center">จำนวน</th>
                  <th className="py-2.5 px-3 w-20 text-center">หน่วย</th>
                  <th className="py-2.5 px-3 w-28 text-right">ราคา/หน่วย</th>
                  <th className="py-2.5 px-3 w-32 text-right">จำนวนเงิน (บาท)</th>
                  <th className="py-2.5 px-3 w-12 text-center no-print">ลบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center font-mono">{item.itemNumber}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{item.description}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">{item.unit}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{item.unitPrice.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {item.totalPrice.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center no-print">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-medium">
                <tr>
                  <td colSpan={5} className="py-2 px-3 text-right text-slate-600">
                    รวมเป็นเงินทั้งสิ้น (ก่อน VAT):
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold">
                    {subTotal.toLocaleString()} ฿
                  </td>
                  <td className="no-print"></td>
                </tr>
                <tr>
                  <td colSpan={5} className="py-2 px-3 text-right text-slate-600">
                    ภาษีมูลค่าเพิ่ม 7%:
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-600">
                    {vat.toFixed(2)} ฿
                  </td>
                  <td className="no-print"></td>
                </tr>
                <tr className="bg-blue-50/60 font-bold text-blue-900">
                  <td colSpan={5} className="py-2.5 px-3 text-right">
                    ยอดเงินรวมสุทธิ:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm">
                    {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Add Item Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-200 no-print">
            <div className="sm:col-span-6">
              <input
                type="text"
                placeholder="ระบุชื่อรายการพัสดุ / ครุภัณฑ์..."
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                className="w-full border rounded-lg p-2 bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                min="1"
                placeholder="จำนวน"
                value={newItemQty}
                onChange={(e) => setNewItemQty(Number(e.target.value))}
                className="w-full border rounded-lg p-2 bg-white text-center font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="หน่วย (เช่น รีม, ชิ้น)"
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="w-full border rounded-lg p-2 bg-white text-center"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                placeholder="ราคา/หน่วย"
                value={newItemPrice || ""}
                onChange={(e) => setNewItemPrice(Number(e.target.value))}
                className="w-full border rounded-lg p-2 bg-white text-right font-mono"
              />
            </div>
            <div className="sm:col-span-12 flex justify-end">
              <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-1.5 bg-blue-900 text-white font-bold rounded-lg shadow-sm"
              >
                + เพิ่มรายการ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
