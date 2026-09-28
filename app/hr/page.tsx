"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Users, 
  Plus, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  FileText, 
  X, 
  Clock, 
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Check,
  Ban,
  CalendarDays,
  FileSignature,
  Briefcase,
  GraduationCap,
  ExternalLink,
  Info
} from "lucide-react";
import { 
  LeaveRequest, 
  UserLeaveQuota, 
  EmploymentContract 
} from "@/lib/types";
import { 
  getHRLeaves, 
  createLeaveRequest, 
  updateLeaveRequestStatus,
  getUserLeaveQuota,
  getAllUserLeaveQuotas,
  saveUserLeaveQuota,
  getEmploymentContracts,
  createEmploymentContract,
  updateEmploymentContract
} from "@/lib/firebaseService";
import { 
  printDocumentView, 
  exportTableToExcel,
  exportLeaveRequestToWord,
  exportEmploymentContractToWord
} from "@/lib/documentGenerator";
import { useRole } from "@/components/RoleContext";

// Working days calculation helper (excluding Saturday and Sunday)
function calculateWorkingDays(startDateStr: string, endDateStr: string, isHalfDay: boolean = false): number {
  if (isHalfDay) return 0.5;
  if (!startDateStr || !endDateStr) return 0;
  
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (start > end) return 0;

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sun, 6 = Sat
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(1, count);
}

export default function HRLeaveManagementPage() {
  const { currentUser: user } = useRole();
  const [activeTab, setActiveTab] = useState<"leaves" | "contracts" | "quotas">("leaves");
  const [loading, setLoading] = useState(true);

  // Data states
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [contracts, setContracts] = useState<EmploymentContract[]>([]);
  const [quotas, setQuotas] = useState<UserLeaveQuota[]>([]);
  const [userQuota, setUserQuota] = useState<UserLeaveQuota | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [selectedContract, setSelectedContract] = useState<EmploymentContract | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  // Form Data for New Leave Request
  const [leaveForm, setLeaveForm] = useState({
    staffName: user?.name || "อ.ฤทธิชัย ภาระวิเศษ",
    position: user?.roleTitle || "อาจารย์ประจำสาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    department: user?.department || "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    employeeType: "contract_academic" as LeaveRequest["employeeType"],
    leaveType: "vacation" as LeaveRequest["leaveType"],
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    isHalfDay: false,
    halfDayPeriod: "morning" as "morning" | "afternoon",
    reason: "",
    substitutePerson: "ผศ.ดร. นฤมล อนันตโชค",
    contactAddress: "คณะศิลปศาสตร์และวิทยาศาสตร์ มรภ.ชัยภูมิ",
    contactPhone: "081-234-5678",
    medicalCertificateUrl: "",
  });

  // Form Data for New Employment Contract
  const [contractForm, setContractForm] = useState({
    contractNumber: "สจ. 015/2569",
    employeeName: "อ.ฤทธิชัย ภาระวิเศษ",
    employeeId: "CPRU-65042",
    position: "อาจารย์ประจำสาขาวิชารัฐศาสตร์",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    contractCategory: "academic_mission" as EmploymentContract["contractCategory"],
    startDate: "2026-10-01",
    endDate: "2027-09-30",
    salary: 28500,
    signatoryFirst: "ผศ.ดร.สานนท์ ด่านภักดี (คณบดี ผู้รับมอบอำนาจ)",
    signatorySecond: "อ.ฤทธิชัย ภาระวิเศษ (ผู้รับจ้าง)",
    signedDocumentUrl: "",
    status: "active" as EmploymentContract["status"]
  });

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [leaveList, contractList, quotaList] = await Promise.all([
        getHRLeaves(),
        getEmploymentContracts(),
        getAllUserLeaveQuotas(2569)
      ]);
      setLeaves(leaveList);
      setContracts(contractList);
      setQuotas(quotaList);

      const uQuota = await getUserLeaveQuota(user?.id || "u-teacher", user?.name, 2569);
      setUserQuota(uQuota);
    } catch (err) {
      console.error("Failed to load HR data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Sync current user name into leave form
  useEffect(() => {
    if (user?.name) {
      setLeaveForm(prev => ({
        ...prev,
        staffName: user.name,
        position: user.roleTitle || prev.position,
        department: user.department || prev.department
      }));
    }
  }, [user]);

  // Calculated working days for current form
  const calculatedDays = useMemo(() => {
    return calculateWorkingDays(leaveForm.startDate, leaveForm.endDate, leaveForm.isHalfDay);
  }, [leaveForm.startDate, leaveForm.endDate, leaveForm.isHalfDay]);

  // Check Overlap Dates
  const hasDateOverlap = useMemo(() => {
    if (!leaveForm.startDate || !leaveForm.endDate) return false;
    const s = new Date(leaveForm.startDate).getTime();
    const e = new Date(leaveForm.endDate).getTime();

    return leaves.some(l => {
      if (l.status === "rejected" || l.status === "cancelled") return false;
      if (l.staffName !== leaveForm.staffName) return false;
      const ls = new Date(l.startDate).getTime();
      const le = new Date(l.endDate).getTime();
      return (s <= le && e >= ls);
    });
  }, [leaves, leaveForm.startDate, leaveForm.endDate, leaveForm.staffName]);

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const matchSearch = searchTerm === "" || 
        l.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.requestNumber && l.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchType = typeFilter === "all" || l.leaveType === typeFilter;
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [leaves, searchTerm, typeFilter, statusFilter]);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      return searchTerm === "" || 
        c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.department.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [contracts, searchTerm]);

  // Handle Create Leave Request
  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasDateOverlap) {
      alert("ไม่สามารถยื่นใบลาได้เนื่องจากมีคำขอลาในช่วงวันที่ดังกล่าวอยู่แล้ว");
      return;
    }

    if (calculatedDays <= 0) {
      alert("กรุณาเลือกช่วงวันที่ลาที่ถูกต้อง");
      return;
    }

    // Determine leave quota values
    let accumulated = 0;
    let currentQuota = 10;
    let usedBefore = 0;
    let remainingAfter = 0;

    if (userQuota) {
      if (leaveForm.leaveType === "vacation") {
        accumulated = userQuota.vacationQuota.accumulated;
        currentQuota = userQuota.vacationQuota.currentYear;
        usedBefore = userQuota.vacationQuota.used;
        remainingAfter = Math.max(0, userQuota.vacationQuota.remaining - calculatedDays);
      } else if (leaveForm.leaveType === "personal") {
        currentQuota = userQuota.personalQuota.currentYear;
        usedBefore = userQuota.personalQuota.used;
        remainingAfter = Math.max(0, userQuota.personalQuota.remaining - calculatedDays);
      } else if (leaveForm.leaveType === "sick") {
        currentQuota = userQuota.sickQuota.currentYear;
        usedBefore = userQuota.sickQuota.used;
        remainingAfter = Math.max(0, userQuota.sickQuota.remaining - calculatedDays);
      }
    }

    try {
      const created = await createLeaveRequest({
        ...leaveForm,
        totalDays: calculatedDays,
        accumulatedDays: accumulated,
        currentYearQuota: currentQuota,
        usedDaysBefore: usedBefore,
        remainingDaysAfter: remainingAfter,
        substituteStatus: "pending",
        status: "submitted"
      }, user);

      setLeaves(prev => [created, ...prev]);
      setShowAddLeaveModal(false);
      alert(`ยื่นใบลาอิเล็กทรอนิกส์สำเร็จ เลขที่คำขอ: ${created.requestNumber}`);
    } catch (err) {
      console.error("Error creating leave:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกคำขอลา");
    }
  };

  // Handle Create Contract
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createEmploymentContract(contractForm, user);
      setContracts(prev => [created, ...prev]);
      setShowAddContractModal(false);
      alert(`บันทึกสัญญาจ้างเลขที่ ${created.contractNumber} เรียบร้อยแล้ว`);
    } catch (err) {
      console.error("Error creating contract:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกสัญญาจ้าง");
    }
  };

  // Workflow Actions
  const handleSubstituteAcknowledge = async (leave: LeaveRequest) => {
    try {
      await updateLeaveRequestStatus(leave.id, "substitute_acknowledged", {
        substituteStatus: "acknowledged"
      }, user);
      setLeaves(prev => prev.map(l => l.id === leave.id ? { ...l, status: "substitute_acknowledged", substituteStatus: "acknowledged" } : l));
      if (selectedLeave?.id === leave.id) {
        setSelectedLeave({ ...selectedLeave, status: "substitute_acknowledged", substituteStatus: "acknowledged" });
      }
      alert("ผู้ปฏิบัติหน้าที่แทนรับทราบเรียบร้อยแล้ว ส่งต่อไปยังผู้ตรวจสอบสิทธิ");
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการปรับสถานะ");
    }
  };

  const handleHRVerify = async (leave: LeaveRequest) => {
    try {
      await updateLeaveRequestStatus(leave.id, "verified", {
        verifiedByName: `${user?.name || "เจ้าหน้าที่บุคคล"} (งาน HR)`,
        verifiedDate: new Date().toISOString().split("T")[0]
      }, user);
      setLeaves(prev => prev.map(l => l.id === leave.id ? { 
        ...l, 
        status: "verified", 
        verifiedByName: `${user?.name || "เจ้าหน้าที่บุคคล"} (งาน HR)`,
        verifiedDate: new Date().toISOString().split("T")[0]
      } : l));
      if (selectedLeave?.id === leave.id) {
        setSelectedLeave({ 
          ...selectedLeave, 
          status: "verified", 
          verifiedByName: `${user?.name || "เจ้าหน้าที่บุคคล"} (งาน HR)`,
          verifiedDate: new Date().toISOString().split("T")[0]
        });
      }
      alert("ตรวจสอบสิทธิวันลาถูกต้อง เสนอต่อคณบดีพิจารณาอนุมัติ");
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการปรับสถานะ");
    }
  };

  const handleDeanApprove = async (leave: LeaveRequest) => {
    // Requester cannot approve their own leave
    if (user?.id && leave.staffId === user.id && user.role !== "admin") {
      alert("ผู้ขอลาไม่สามารถอนุมัติคำขอของตนเองได้");
      return;
    }

    try {
      await updateLeaveRequestStatus(leave.id, "approved", {
        approverName: user?.name || "ผศ.ดร.สานนท์ ด่านภักดี",
        approverPosition: user?.roleTitle || "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
        approverComment: "อนุมัติให้ลาได้ตามระเบียบ",
        approvalDate: new Date().toISOString().split("T")[0]
      }, user);

      // Deduct quota
      if (userQuota && (leave.staffId === userQuota.userId || leave.staffName === userQuota.staffName)) {
        const updatedQuota = { ...userQuota };
        if (leave.leaveType === "vacation") {
          updatedQuota.vacationQuota.used += leave.totalDays;
          updatedQuota.vacationQuota.remaining = Math.max(0, (updatedQuota.vacationQuota.accumulated + updatedQuota.vacationQuota.currentYear) - updatedQuota.vacationQuota.used);
        } else if (leave.leaveType === "personal") {
          updatedQuota.personalQuota.used += leave.totalDays;
          updatedQuota.personalQuota.remaining = Math.max(0, updatedQuota.personalQuota.currentYear - updatedQuota.personalQuota.used);
        } else if (leave.leaveType === "sick") {
          updatedQuota.sickQuota.used += leave.totalDays;
          updatedQuota.sickQuota.remaining = Math.max(0, updatedQuota.sickQuota.currentYear - updatedQuota.sickQuota.used);
        } else if (leave.leaveType === "duty") {
          updatedQuota.dutyQuota.used += 1;
        }
        await saveUserLeaveQuota(updatedQuota, user);
        setUserQuota(updatedQuota);
      }

      setLeaves(prev => prev.map(l => l.id === leave.id ? { 
        ...l, 
        status: "approved", 
        approverName: user?.name || "ผศ.ดร.สานนท์ ด่านภักดี",
        approverPosition: user?.roleTitle || "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
        approvalDate: new Date().toISOString().split("T")[0]
      } : l));
      
      if (selectedLeave?.id === leave.id) {
        setSelectedLeave({ 
          ...selectedLeave, 
          status: "approved", 
          approverName: user?.name || "ผศ.ดร.สานนท์ ด่านภักดี",
          approverPosition: user?.roleTitle || "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
          approvalDate: new Date().toISOString().split("T")[0]
        });
      }
      alert("อนุมัติคำขอลาเรียบร้อยแล้ว");
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  const handleDeanReject = async (leave: LeaveRequest) => {
    if (!rejectReason.trim()) {
      alert("กรุณาระบุเหตุผลการไม่อนุมัติ");
      return;
    }

    try {
      await updateLeaveRequestStatus(leave.id, "rejected", {
        rejectionReason: rejectReason,
        approverName: user?.name || "ผศ.ดร.สานนท์ ด่านภักดี",
        approvalDate: new Date().toISOString().split("T")[0]
      }, user);

      setLeaves(prev => prev.map(l => l.id === leave.id ? { 
        ...l, 
        status: "rejected", 
        rejectionReason: rejectReason,
        approvalDate: new Date().toISOString().split("T")[0]
      } : l));

      setShowRejectBox(false);
      setRejectReason("");
      setSelectedLeave(null);
      alert("บันทึกการไม่อนุมัติเรียบร้อยแล้ว");
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleCancelLeave = async (leave: LeaveRequest) => {
    if (!confirm("คุณต้องการยกเลิกคำขอลานี้ใช่หรือไม่? (วันลาจะถูกคืนเข้าสู่สิทธิคงเหลือ)")) return;

    try {
      await updateLeaveRequestStatus(leave.id, "cancelled", {
        cancelledAt: new Date().toISOString(),
        cancelledReason: "ผู้ขอยื่นขอยกเลิกการลา"
      }, user);

      // Restore quota if it was approved
      if (leave.status === "approved" && userQuota) {
        const restoredQuota = { ...userQuota };
        if (leave.leaveType === "vacation") {
          restoredQuota.vacationQuota.used = Math.max(0, restoredQuota.vacationQuota.used - leave.totalDays);
          restoredQuota.vacationQuota.remaining += leave.totalDays;
        } else if (leave.leaveType === "personal") {
          restoredQuota.personalQuota.used = Math.max(0, restoredQuota.personalQuota.used - leave.totalDays);
          restoredQuota.personalQuota.remaining += leave.totalDays;
        } else if (leave.leaveType === "sick") {
          restoredQuota.sickQuota.used = Math.max(0, restoredQuota.sickQuota.used - leave.totalDays);
          restoredQuota.sickQuota.remaining += leave.totalDays;
        }
        await saveUserLeaveQuota(restoredQuota, user);
        setUserQuota(restoredQuota);
      }

      setLeaves(prev => prev.map(l => l.id === leave.id ? { ...l, status: "cancelled" } : l));
      if (selectedLeave?.id === leave.id) {
        setSelectedLeave({ ...selectedLeave, status: "cancelled" });
      }
      alert("ยกเลิกคำขอลาและคืนสิทธิวันลาเรียบร้อยแล้ว");
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการยกเลิก");
    }
  };

  // Helper for Export Table to Excel
  const handleExportExcel = () => {
    if (activeTab === "leaves") {
      const rows = leaves.map(l => ({
        "เลขที่คำขอ": l.requestNumber || "-",
        "ชื่อ-สกุล": l.staffName,
        "ตำแหน่ง": l.position,
        "สังกัด": l.department,
        "ประเภทการลา": l.leaveType === "vacation" ? "ลาพักผ่อน" : l.leaveType === "sick" ? "ลาป่วย" : l.leaveType === "personal" ? "ลากิจส่วนตัว" : "ไปราชการ",
        "วันเริ่มต้น": l.startDate,
        "วันสิ้นสุด": l.endDate,
        "จำนวนวัน": `${l.totalDays} วัน`,
        "ผู้ปฏิบัติหน้าที่แทน": l.substitutePerson,
        "สถานะ": l.status === "approved" ? "อนุมัติแล้ว" : l.status === "submitted" ? "ยื่นคำขอ" : l.status === "verified" ? "ตรวจสิทธิแล้ว" : l.status === "rejected" ? "ไม่อนุมัติ" : "ยกเลิก"
      }));
      exportTableToExcel(rows, "ทะเบียนการลาบุคลากร_มรภชัยภูมิ", "รายการลา");
    } else {
      const rows = contracts.map(c => ({
        "เลขที่สัญญา": c.contractNumber,
        "ชื่อ-สกุลผู้รับจ้าง": c.employeeName,
        "รหัสบุคลากร": c.employeeId || "-",
        "ตำแหน่ง": c.position,
        "สังกัด": c.department,
        "ประเภทสัญญา": c.contractCategory === "academic_mission" ? "พนักงานจ้างตามภารกิจ (วิชาการ)" : c.contractCategory === "general_mission" ? "พนักงานจ้างตามภารกิจ (ทั่วไป)" : "พนักงานมหาวิทยาลัย",
        "วันเริ่มสัญญา": c.startDate,
        "วันสิ้นสุดสัญญา": c.endDate,
        "อัตราเงินเดือน": c.salary,
        "สถานะ": c.status === "active" ? "มีผลบังคับใช้" : c.status === "expiring_soon" ? "ใกล้หมดอายุ" : "ต่อสัญญาแล้ว"
      }));
      exportTableToExcel(rows, "ทะเบียนสัญญาจ้างบุคลากร_มรภชัยภูมิ", "รายการสัญญาจ้าง");
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ระบบบริหารงานบุคคลและการลา (HR & e-Leave Management)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ยื่นขออนุมัติการลา สิทธิวันลาสะสม ทะเบียนสัญญาจ้าง และแฟ้มประวัติอาจารย์ คณะศิลปศาสตร์และวิทยาศาสตร์
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/hr/portfolio"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-blue-900" />
            <span>แฟ้มประวัติและผลงาน / SAR</span>
          </Link>

          <button
            type="button"
            onClick={printDocumentView}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์รายงาน (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>ส่งออก Excel</span>
          </button>

          {activeTab === "leaves" ? (
            <button
              type="button"
              onClick={() => setShowAddLeaveModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>เขียนใบลาใหม่</span>
            </button>
          ) : activeTab === "contracts" ? (
            <button
              type="button"
              onClick={() => setShowAddContractModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกสัญญาจ้างใหม่</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("leaves")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === "leaves" 
              ? "bg-blue-900 text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>การลาอิเล็กทรอนิกส์ (e-Leave)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === "leaves" ? "bg-blue-800 text-white" : "bg-slate-200 text-slate-700"
          }`}>
            {leaves.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contracts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === "contracts" 
              ? "bg-blue-900 text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileSignature className="w-4 h-4" />
          <span>ทะเบียนสัญญาจ้างบุคลากร (Contracts)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === "contracts" ? "bg-blue-800 text-white" : "bg-slate-200 text-slate-700"
          }`}>
            {contracts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("quotas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === "quotas" 
              ? "bg-blue-900 text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>สิทธิและโควตาวันลาบุคลากร (Leave Quotas Master)</span>
        </button>
      </div>

      {/* TAB 1: LEAVES CONTENT */}
      {activeTab === "leaves" && (
        <div className="space-y-6">
          {/* Leave Quota Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vacation Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">ลาพักผ่อนประจำปี</span>
                <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  สะสม {userQuota?.vacationQuota.accumulated || 0} + ปีนี้ {userQuota?.vacationQuota.currentYear || 10}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-900">
                  {userQuota?.vacationQuota.remaining ?? 10}
                </span>
                <span className="text-xs text-slate-500 font-medium">วันคงเหลือ</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                ใช้ไปแล้ว {userQuota?.vacationQuota.used || 0} วัน (สิทธิรวม {(userQuota?.vacationQuota.accumulated || 0) + (userQuota?.vacationQuota.currentYear || 10)} วัน)
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-blue-900 h-full rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, (((userQuota?.vacationQuota.used || 0) / Math.max(1, (userQuota?.vacationQuota.accumulated || 0) + (userQuota?.vacationQuota.currentYear || 10)))) * 100)}%` 
                  }}
                />
              </div>
            </div>

            {/* Personal Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">ลากิจส่วนตัว</span>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  สิทธิ {userQuota?.personalQuota.currentYear || 45} วัน/ปี
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {userQuota?.personalQuota.remaining ?? 45}
                </span>
                <span className="text-xs text-slate-500 font-medium">วันคงเหลือ</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                ใช้ไปแล้ว {userQuota?.personalQuota.used || 0} วัน (ยื่นล่วงหน้าตามระเบียบ)
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-slate-700 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (((userQuota?.personalQuota.used || 0) / 45) * 100))}%` }}
                />
              </div>
            </div>

            {/* Sick Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">ลาป่วย</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  สิทธิ {userQuota?.sickQuota.currentYear || 60} วัน/ปี
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {userQuota?.sickQuota.remaining ?? 60}
                </span>
                <span className="text-xs text-slate-500 font-medium">วันคงเหลือ</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                ใช้ไป {userQuota?.sickQuota.used || 0} วัน (แนบใบรับรองแพทย์เมื่อลา &ge; 3 วัน)
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (((userQuota?.sickQuota.used || 0) / 60) * 100))}%` }}
                />
              </div>
            </div>

            {/* Duty Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">ไปราชการ</span>
                <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                  คำสั่ง/หนังสือเชิญ
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {userQuota?.dutyQuota.used || 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">ครั้งในปีนี้</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                ปฏิบัติหน้าที่ภายนอกตามภารกิจคณะและมหาวิทยาลัย
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-amber-600 h-full rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้ขอลา, เลขที่คำขอ, เหตุผล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">ประเภท:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="vacation">ลาพักผ่อน</option>
                  <option value="sick">ลาป่วย</option>
                  <option value="personal">ลากิจส่วนตัว</option>
                  <option value="duty">ไปราชการ</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">สถานะ:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="submitted">ยื่นคำขอ</option>
                  <option value="substitute_acknowledged">ผู้แทนรับทราบ</option>
                  <option value="verified">ตรวจสิทธิแล้ว</option>
                  <option value="approved">อนุมัติแล้ว</option>
                  <option value="rejected">ไม่อนุมัติ</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>
            </div>
          </div>

          {/* Leaves Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">
                ทะเบียนคำขอลาอิเล็กทรอนิกส์ ({filteredLeaves.length} รายการ)
              </span>
              <span className="text-[11px] text-slate-400">
                นับเฉพาะวันทำการราชการ (ไม่รวมวันเสาร์-อาทิตย์)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4 font-semibold">เลขที่ / วันยื่น</th>
                    <th className="py-3 px-4 font-semibold">ผู้ขอลา</th>
                    <th className="py-3 px-4 font-semibold">ประเภทการลา</th>
                    <th className="py-3 px-4 font-semibold">ช่วงวันที่ลา</th>
                    <th className="py-3 px-4 font-semibold text-center">จำนวนวัน</th>
                    <th className="py-3 px-4 font-semibold">ผู้ปฏิบัติหน้าที่แทน</th>
                    <th className="py-3 px-4 font-semibold">สถานะ</th>
                    <th className="py-3 px-4 font-semibold text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลคำขอลาตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    filteredLeaves.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">
                          <div>{l.requestNumber || "ลพ. -/2569"}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(l.createdAt).toLocaleDateString("th-TH")}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{l.staffName}</div>
                          <div className="text-[10px] text-slate-500">{l.department}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            l.leaveType === "vacation" 
                              ? "bg-blue-50 text-blue-900 border border-blue-200" 
                              : l.leaveType === "sick" 
                              ? "bg-emerald-50 text-emerald-900 border border-emerald-200" 
                              : l.leaveType === "personal"
                              ? "bg-slate-100 text-slate-800 border border-slate-300"
                              : "bg-amber-50 text-amber-900 border border-amber-200"
                          }`}>
                            {l.leaveType === "vacation" ? "ลาพักผ่อน" : l.leaveType === "sick" ? "ลาป่วย" : l.leaveType === "personal" ? "ลากิจส่วนตัว" : "ไปราชการ"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-800">
                          <div>{l.startDate} ถึง {l.endDate}</div>
                          {l.isHalfDay && (
                            <div className="text-[10px] text-amber-700 font-medium">
                              (ครึ่งวัน: {l.halfDayPeriod === "morning" ? "ช่วงเช้า" : "ช่วงบ่าย"})
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-slate-900">
                          {l.totalDays} วัน
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-800">{l.substitutePerson}</div>
                          <div className="text-[10px]">
                            {l.substituteStatus === "acknowledged" ? (
                              <span className="text-emerald-700 font-medium">รับทราบแล้ว</span>
                            ) : (
                              <span className="text-amber-700 font-medium">รอการรับทราบ</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === "approved" 
                              ? "bg-emerald-100 text-emerald-900" 
                              : l.status === "submitted" 
                              ? "bg-amber-100 text-amber-900" 
                              : l.status === "substitute_acknowledged"
                              ? "bg-blue-100 text-blue-900"
                              : l.status === "verified"
                              ? "bg-indigo-100 text-indigo-900"
                              : l.status === "rejected"
                              ? "bg-rose-100 text-rose-900"
                              : "bg-slate-100 text-slate-500 line-through"
                          }`}>
                            {l.status === "approved" ? "อนุมัติแล้ว" :
                             l.status === "submitted" ? "ยื่นคำขอ" :
                             l.status === "substitute_acknowledged" ? "ผู้แทนรับทราบ" :
                             l.status === "verified" ? "ตรวจสิทธิแล้ว" :
                             l.status === "rejected" ? "ไม่อนุมัติ" : "ยกเลิก"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => exportLeaveRequestToWord(l)}
                              title="ดาวน์โหลดแบบใบลา Word (.docx)"
                              className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedLeave(l)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition-colors"
                            >
                              ดูรายละเอียด
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTRACTS CONTENT */}
      {activeTab === "contracts" && (
        <div className="space-y-6">
          {/* Contracts KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
              <span className="text-xs font-semibold text-slate-500">สัญญาทั้งหมด</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{contracts.length} ฉบับ</p>
              <p className="text-[11px] text-slate-400 mt-0.5">ในฐานข้อมูลคณะ</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
              <span className="text-xs font-semibold text-emerald-700">มีผลบังคับใช้ (Active)</span>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {contracts.filter(c => c.status === "active").length} ฉบับ
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">ยังไม่ถึงกำหนดสิ้นสุด</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
              <span className="text-xs font-semibold text-amber-700">ใกล้หมดอายุ (&lt; 60 วัน)</span>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {contracts.filter(c => c.status === "expiring_soon").length} ฉบับ
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">ต้องดำเนินการประเมินต่อสัญญา</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
              <span className="text-xs font-semibold text-blue-700">ต่อสัญญาแล้ว</span>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {contracts.filter(c => c.status === "renewed").length} ฉบับ
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">ผ่านการอนุมัติ ก.บ.ม.</p>
            </div>
          </div>

          {/* Contracts Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">
                ทะเบียนสัญญาจ้างปฏิบัติงานอาจารย์และบุคลากร ({filteredContracts.length} สัญญา)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4 font-semibold">เลขที่สัญญา</th>
                    <th className="py-3 px-4 font-semibold">ผู้รับจ้าง (อาจารย์/บุคลากร)</th>
                    <th className="py-3 px-4 font-semibold">ตำแหน่ง & สังกัด</th>
                    <th className="py-3 px-4 font-semibold">ประเภทสัญญา</th>
                    <th className="py-3 px-4 font-semibold">ระยะเวลาสัญญา</th>
                    <th className="py-3 px-4 font-semibold text-right">ค่าตอบแทน</th>
                    <th className="py-3 px-4 font-semibold">สถานะ</th>
                    <th className="py-3 px-4 font-semibold text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredContracts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">
                        {c.contractNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{c.employeeId || "-"}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800">{c.position}</div>
                        <div className="text-[10px] text-slate-500">{c.department}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-700">
                          {c.contractCategory === "academic_mission" ? "พนักงานจ้างตามภารกิจ (วิชาการ)" :
                           c.contractCategory === "general_mission" ? "พนักงานจ้างตามภารกิจ (ทั่วไป)" : "พนักงานมหาวิทยาลัย"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div>{c.startDate} ถึง {c.endDate}</div>
                        {c.status === "expiring_soon" && (
                          <span className="text-[10px] text-amber-700 font-bold">ใกล้หมดอายุสัญญา</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {c.salary.toLocaleString()} บาท
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === "active" ? "bg-emerald-100 text-emerald-900" :
                          c.status === "expiring_soon" ? "bg-amber-100 text-amber-900" :
                          "bg-blue-100 text-blue-900"
                        }`}>
                          {c.status === "active" ? "มีผลบังคับใช้" :
                           c.status === "expiring_soon" ? "ใกล้หมดอายุ" : "ต่อสัญญาแล้ว"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => exportEmploymentContractToWord(c)}
                            title="ดาวน์โหลดสรุปสัญญา Word (.docx)"
                            className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEAVE QUOTAS MASTER */}
      {activeTab === "quotas" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card">
            <div className="p-2 border-b border-slate-100 flex items-center justify-between pb-3">
              <div>
                <h3 className="font-bold text-xs text-slate-900">
                  ฐานข้อมูลสิทธิและโควตาวันลาบุคลากร ประจำปีงบประมาณ 2569
                </h3>
                <p className="text-[11px] text-slate-500">
                  คำนวณตามระเบียบ ก.พ.อ. และข้อบังคับมหาวิทยาลัยราชภัฏชัยภูมิ ว่าด้วยการลาของบุคลากร
                </p>
              </div>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4 font-semibold">ชื่อ-สกุล บุคลากร</th>
                    <th className="py-3 px-4 font-semibold">ตำแหน่ง & สังกัด</th>
                    <th className="py-3 px-4 font-semibold text-center">ลาพักผ่อน (สะสม + สิทธิปีนี้)</th>
                    <th className="py-3 px-4 font-semibold text-center">ลาพักผ่อนคงเหลือ</th>
                    <th className="py-3 px-4 font-semibold text-center">ลากิจคงเหลือ</th>
                    <th className="py-3 px-4 font-semibold text-center">ลาป่วยคงเหลือ</th>
                    <th className="py-3 px-4 font-semibold text-center">ไปราชการ (ครั้ง)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {quotas.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {q.staffName}
                        <div className="text-[10px] text-slate-400 font-normal">{q.employeeId || "-"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{q.position}</div>
                        <div className="text-[10px] text-slate-500">{q.department}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {q.vacationQuota.accumulated} + {q.vacationQuota.currentYear} วัน
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-blue-900">
                        {q.vacationQuota.remaining} วัน
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {q.personalQuota.remaining} วัน
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-800">
                        {q.sickQuota.remaining} วัน
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-amber-900">
                        {q.dutyQuota.used} ครั้ง
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE LEAVE REQUEST */}
      {showAddLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-float w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">เขียนใบลาอิเล็กทรอนิกส์ (e-Leave)</h3>
                <p className="text-xs text-slate-500">แบบฟอร์มขออนุมัติการลา คณะศิลปศาสตร์และวิทยาศาสตร์ มรภ.ชัยภูมิ</p>
              </div>
              <button type="button" onClick={() => setShowAddLeaveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeave} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อ-สกุล ผู้ขอลา</label>
                  <input
                    type="text"
                    required
                    value={leaveForm.staffName}
                    onChange={(e) => setLeaveForm({ ...leaveForm, staffName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ตำแหน่ง / สังกัด</label>
                  <input
                    type="text"
                    required
                    value={leaveForm.position}
                    onChange={(e) => setLeaveForm({ ...leaveForm, position: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ประเภทการลา</label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as LeaveRequest["leaveType"] })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-900 font-semibold"
                  >
                    <option value="vacation">ลาพักผ่อนประจำปี</option>
                    <option value="sick">ลาป่วย</option>
                    <option value="personal">ลากิจส่วนตัว</option>
                    <option value="duty">ไปราชการ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ประเภทบุคลากร</label>
                  <select
                    value={leaveForm.employeeType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, employeeType: e.target.value as LeaveRequest["employeeType"] })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white"
                  >
                    <option value="contract_academic">พนักงานจ้างตามภารกิจ (ประเภทวิชาการ)</option>
                    <option value="university_staff">พนักงานมหาวิทยาลัย</option>
                    <option value="civil_servant">ข้าราชการ</option>
                    <option value="temporary_employee">ลูกจ้างชั่วคราว</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ตั้งแต่วันที่</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ถึงวันที่</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              {/* Half-Day Option & Calculation Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={leaveForm.isHalfDay}
                      onChange={(e) => setLeaveForm({ ...leaveForm, isHalfDay: e.target.checked })}
                      className="rounded text-blue-900"
                    />
                    <span className="font-semibold text-slate-700">ลาครึ่งวัน (0.5 วัน)</span>
                  </label>

                  {leaveForm.isHalfDay && (
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="halfPeriod"
                          checked={leaveForm.halfDayPeriod === "morning"}
                          onChange={() => setLeaveForm({ ...leaveForm, halfDayPeriod: "morning" })}
                        />
                        <span>ช่วงเช้า</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="halfPeriod"
                          checked={leaveForm.halfDayPeriod === "afternoon"}
                          onChange={() => setLeaveForm({ ...leaveForm, halfDayPeriod: "afternoon" })}
                        />
                        <span>ช่วงบ่าย</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200/60">
                  <span>จำนวนวันทำการที่ขอลา (หักเสาร์-อาทิตย์):</span>
                  <span className="text-base font-bold text-blue-900">{calculatedDays} วันทำการ</span>
                </div>

                {hasDateOverlap && (
                  <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-semibold pt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>แจ้งเตือน: ช่วงวันที่ดังกล่าวมีการยื่นคำขอลาในระบบอยู่แล้ว</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เหตุผลและความจำเป็น</label>
                <textarea
                  rows={2}
                  required
                  placeholder="ระบุเหตุผลในการขอลา..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 resize-none"
                />
              </div>

              {leaveForm.leaveType === "sick" && calculatedDays >= 3 && (
                <div>
                  <label className="block font-semibold text-rose-800 mb-1">
                    ลิงก์แนบใบรับรองแพทย์ (เนื่องจากลาป่วย &ge; 3 วัน)
                  </label>
                  <input
                    type="url"
                    placeholder="https://... (URL เอกสารใบรับรองแพทย์)"
                    value={leaveForm.medicalCertificateUrl}
                    onChange={(e) => setLeaveForm({ ...leaveForm, medicalCertificateUrl: e.target.value })}
                    className="w-full border border-rose-200 rounded-xl p-2.5 bg-rose-50/50"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ผู้ปฏิบัติหน้าที่แทน</label>
                  <input
                    type="text"
                    required
                    placeholder="ชื่อ-สกุล อาจารย์ผู้รับมอบหมายงาน"
                    value={leaveForm.substitutePerson}
                    onChange={(e) => setLeaveForm({ ...leaveForm, substitutePerson: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">หมายเลขโทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    required
                    value={leaveForm.contactPhone}
                    onChange={(e) => setLeaveForm({ ...leaveForm, contactPhone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ที่อยู่ที่สามารถติดต่อได้ระหว่างลา</label>
                <input
                  type="text"
                  required
                  value={leaveForm.contactAddress}
                  onChange={(e) => setLeaveForm({ ...leaveForm, contactAddress: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLeaveModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={hasDateOverlap || calculatedDays <= 0}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-xl font-semibold shadow-sm"
                >
                  ยื่นใบลาอิเล็กทรอนิกส์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE EMPLOYMENT CONTRACT */}
      {showAddContractModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-float w-full max-w-xl p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">บันทึกสัญญาจ้างบุคลากร</h3>
              <button type="button" onClick={() => setShowAddContractModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สัญญาเลขที่</label>
                  <input
                    type="text"
                    required
                    value={contractForm.contractNumber}
                    onChange={(e) => setContractForm({ ...contractForm, contractNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ประเภทสัญญาจ้าง</label>
                  <select
                    value={contractForm.contractCategory}
                    onChange={(e) => setContractForm({ ...contractForm, contractCategory: e.target.value as EmploymentContract["contractCategory"] })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white"
                  >
                    <option value="academic_mission">พนักงานจ้างตามภารกิจ (ประเภทวิชาการ)</option>
                    <option value="general_mission">พนักงานจ้างตามภารกิจ (ประเภททั่วไป)</option>
                    <option value="university_staff">พนักงานมหาวิทยาลัย</option>
                    <option value="temporary_employee">ลูกจ้างชั่วคราว</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อ-สกุล ผู้รับจ้าง</label>
                  <input
                    type="text"
                    required
                    value={contractForm.employeeName}
                    onChange={(e) => setContractForm({ ...contractForm, employeeName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสบุคลากร</label>
                  <input
                    type="text"
                    value={contractForm.employeeId}
                    onChange={(e) => setContractForm({ ...contractForm, employeeId: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    required
                    value={contractForm.position}
                    onChange={(e) => setContractForm({ ...contractForm, position: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สังกัด / สาขาวิชา</label>
                  <input
                    type="text"
                    required
                    value={contractForm.department}
                    onChange={(e) => setContractForm({ ...contractForm, department: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">วันเริ่มสัญญา</label>
                  <input
                    type="date"
                    required
                    value={contractForm.startDate}
                    onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">วันสิ้นสุดสัญญา</label>
                  <input
                    type="date"
                    required
                    value={contractForm.endDate}
                    onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">อัตราค่าตอบแทน / เงินเดือน (บาท/เดือน)</label>
                  <input
                    type="number"
                    required
                    value={contractForm.salary}
                    onChange={(e) => setContractForm({ ...contractForm, salary: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddContractModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold shadow-sm"
                >
                  บันทึกสัญญาจ้าง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LEAVE DETAIL & APPROVAL WORKFLOW */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-float w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto animate-in fade-in space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">
                    คำขอลาเลขที่ {selectedLeave.requestNumber || "ลพ. -/2569"}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedLeave.status === "approved" ? "bg-emerald-100 text-emerald-900" :
                    selectedLeave.status === "submitted" ? "bg-amber-100 text-amber-900" :
                    selectedLeave.status === "substitute_acknowledged" ? "bg-blue-100 text-blue-900" :
                    selectedLeave.status === "verified" ? "bg-indigo-100 text-indigo-900" :
                    selectedLeave.status === "rejected" ? "bg-rose-100 text-rose-900" : "bg-slate-200"
                  }`}>
                    {selectedLeave.status === "approved" ? "อนุมัติแล้ว" :
                     selectedLeave.status === "submitted" ? "ยื่นคำขอ" :
                     selectedLeave.status === "substitute_acknowledged" ? "ผู้แทนรับทราบ" :
                     selectedLeave.status === "verified" ? "ตรวจสิทธิแล้ว" :
                     selectedLeave.status === "rejected" ? "ไม่อนุมัติ" : "ยกเลิก"}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  ยื่นเมื่อ {new Date(selectedLeave.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              <button type="button" onClick={() => { setSelectedLeave(null); setShowRejectBox(false); }} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Leave Details Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">ผู้ขอลา</span>
                <span className="font-bold text-slate-900 text-sm">{selectedLeave.staffName}</span>
                <span className="text-slate-500 block">{selectedLeave.position}</span>
                <span className="text-slate-400 block">{selectedLeave.department}</span>
              </div>

              <div>
                <span className="text-slate-400 block">ประเภทการลา</span>
                <span className="font-bold text-blue-900 text-sm">
                  {selectedLeave.leaveType === "vacation" ? "ลาพักผ่อนประจำปี" :
                   selectedLeave.leaveType === "sick" ? "ลาป่วย" :
                   selectedLeave.leaveType === "personal" ? "ลากิจส่วนตัว" : "ไปราชการ"}
                </span>
                <span className="text-slate-600 block mt-1">
                  ช่วงวันที่: {selectedLeave.startDate} ถึง {selectedLeave.endDate}
                </span>
                <span className="text-slate-900 font-bold block">
                  จำนวน: {selectedLeave.totalDays} วันทำการ
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-400 block">เหตุผลและความจำเป็น</span>
                <span className="text-slate-800 font-medium">{selectedLeave.reason}</span>
              </div>

              <div>
                <span className="text-slate-400 block">ผู้ปฏิบัติหน้าที่แทน</span>
                <span className="text-slate-900 font-semibold">{selectedLeave.substitutePerson}</span>
                <span className={`block text-[11px] font-bold ${selectedLeave.substituteStatus === "acknowledged" ? "text-emerald-700" : "text-amber-700"}`}>
                  ({selectedLeave.substituteStatus === "acknowledged" ? "รับทราบและยินดีปฏิบัติหน้าที่แทน" : "รอการรับทราบ"})
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">ที่อยู่และเบอร์โทรระหว่างลา</span>
                <span className="text-slate-800">{selectedLeave.contactAddress}</span>
                <span className="text-slate-500 block">โทร: {selectedLeave.contactPhone || "-"}</span>
              </div>
            </div>

            {/* Quota Statistics Table in Modal */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 p-2.5 font-bold text-slate-800 text-xs">
                สถิติวันลาและการคำนวณสิทธิ
              </div>
              <table className="w-full text-center text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2 px-3">วันลาสะสม</th>
                    <th className="py-2 px-3">สิทธิปีนี้</th>
                    <th className="py-2 px-3">ลามาแล้ว</th>
                    <th className="py-2 px-3">ลาครั้งนี้</th>
                    <th className="py-2 px-3">คงเหลือสุทธิ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2 px-3">{selectedLeave.accumulatedDays || 0} วัน</td>
                    <td className="py-2 px-3">{selectedLeave.currentYearQuota || 10} วัน</td>
                    <td className="py-2 px-3">{selectedLeave.usedDaysBefore || 0} วัน</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{selectedLeave.totalDays} วัน</td>
                    <td className="py-2 px-3 font-bold text-blue-900">{selectedLeave.remainingDaysAfter} วัน</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Approver Signatures & Comments */}
            {selectedLeave.verifiedByName && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-slate-500 block text-[11px]">การตรวจสอบสิทธิ:</span>
                <span className="font-semibold text-slate-800">{selectedLeave.verifiedByName}</span>
                <span className="text-slate-400 text-[10px] ml-2">วันที่ {selectedLeave.verifiedDate}</span>
              </div>
            )}

            {selectedLeave.approverName && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <span className="text-emerald-800 block font-semibold">การอนุมัติโดยผู้บริหาร:</span>
                <span className="font-bold text-slate-900">{selectedLeave.approverName}</span>
                <span className="text-slate-500 block">{selectedLeave.approverPosition}</span>
                <span className="text-emerald-900 block mt-1">{selectedLeave.approverComment}</span>
              </div>
            )}

            {selectedLeave.rejectionReason && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <span className="text-rose-800 font-bold block">เหตุผลที่ไม่อนุมัติ:</span>
                <span className="text-rose-900">{selectedLeave.rejectionReason}</span>
              </div>
            )}

            {/* Reject Box */}
            {showRejectBox && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <label className="font-semibold text-rose-900 block">ระบุเหตุผลการไม่อนุมัติ</label>
                <textarea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="เช่น มีภารกิจการสอนที่ยังไม่ได้จัดสอนชดเชย หรือช่วงเวลาทับซ้อนกับการสอบ..."
                  className="w-full border border-rose-300 rounded-lg p-2 bg-white text-slate-800"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectBox(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 bg-white"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeanReject(selectedLeave)}
                    className="px-3 py-1.5 bg-rose-700 text-white rounded-lg font-semibold"
                  >
                    ยืนยันไม่อนุมัติ
                  </button>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportLeaveRequestToWord(selectedLeave)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด Word ใบลา</span>
                </button>

                {selectedLeave.status !== "cancelled" && selectedLeave.status !== "rejected" && (
                  <button
                    type="button"
                    onClick={() => handleCancelLeave(selectedLeave)}
                    className="text-rose-600 hover:underline text-[11px] font-semibold ml-2"
                  >
                    ขอยกเลิกคำขอนี้
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Workflow Actions */}
                {selectedLeave.status === "submitted" && (
                  <button
                    type="button"
                    onClick={() => handleSubstituteAcknowledge(selectedLeave)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>ผู้แทนรับทราบ</span>
                  </button>
                )}

                {selectedLeave.status === "substitute_acknowledged" && (
                  <button
                    type="button"
                    onClick={() => handleHRVerify(selectedLeave)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl font-semibold shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ตรวจสอบสิทธิ (HR)</span>
                  </button>
                )}

                {(selectedLeave.status === "verified" || selectedLeave.status === "substitute_acknowledged" || selectedLeave.status === "submitted") && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(true)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl font-semibold"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>ไม่อนุมัติ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeanApprove(selectedLeave)}
                      className="flex items-center gap-1 px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>อนุมัติการลา (คณบดี)</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
