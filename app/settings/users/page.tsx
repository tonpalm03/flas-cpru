"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Clock, 
  Ban, 
  KeyRound, 
  Mail, 
  Building2, 
  Trash2, 
  Save, 
  Send, 
  Check, 
  RefreshCw,
  Layers,
  ArrowLeft,
  UserCheck
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { 
  getAllUsers, 
  updateUserProfile, 
  approvePendingUser, 
  getAccountInvitations, 
  createAccountInvitation, 
  revokeAccountInvitation,
  getEmployees
} from "@/lib/firebaseService";
import { UserProfile, UserRole, UserAccountStatus, AccountInvitation, EmployeeRecord } from "@/lib/types";

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; desc: string }> = [
  { value: "admin", label: "Super Admin (ผู้ดูแลระบบกลาง)", desc: "จัดการบัญชีผู้ใช้ สิทธิ์ และแก้ไขข้อมูลทุกโมดูล" },
  { value: "dean", label: "คณบดี / ผู้บริหาร", desc: "อนุมัติโครงการ งบประมาณ คำขอพัสดุ ใบลา และลงนามเอกสาร" },
  { value: "staff_hr", label: "เจ้าหน้าที่งานบุคคล (HR)", desc: "ดูแลทะเบียนบุคลากร ตรวจเวลาการทำงาน e-Leave และปิดงวด" },
  { value: "staff_finance", label: "เจ้าหน้าที่การเงินและงบประมาณ", desc: "คุมงบประมาณรายได้ สัญญายืมเงิน และเบิกจ่ายค่าสอน" },
  { value: "staff_procurement", label: "เจ้าหน้าที่พัสดุและจัดซื้อ", desc: "จัดการใบขอซื้อ-ขอจ้าง (PR) และงานตรวจรับพัสดุ" },
  { value: "staff_plan", label: "เจ้าหน้าที่นโยบายและแผน", desc: "ติดตามโครงการยุทธศาสตร์ 2569 และตัวชี้วัด KPIs" },
  { value: "lecturer", label: "อาจารย์ประจำสาขาวิชา", desc: "ลงเวลาทำงาน ยื่นใบลา เสนอโครงการ และจัดทำ SAR" },
  { value: "gov_officer", label: "เจ้าหน้าที่สายสนับสนุน", desc: "ลงเวลาทำงาน ยื่นใบลา และเบิกจ่ายทั่วไป" },
];

export default function UserManagementPage() {
  const { currentUser, isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState<"users" | "invitations">("users");

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<AccountInvitation[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteEmployeeId, setInviteEmployeeId] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("lecturer");
  const [inviteDepartment, setInviteDepartment] = useState("สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์");
  const [inviting, setInviting] = useState(false);

  // Edit User Modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("lecturer");
  const [editStatus, setEditStatus] = useState<UserAccountStatus>("active");
  const [editDepartment, setEditDepartment] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editReason, setEditReason] = useState("");
  const [updating, setUpdating] = useState(false);

  // Feedback
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [uList, invList, empList] = await Promise.all([
        getAllUsers(),
        getAccountInvitations(),
        getEmployees()
      ]);
      setUsers(uList);
      setInvitations(invList);
      setEmployees(empList);
    } catch (err) {
      console.error("Load users error:", err);
      showToast("error", "ไม่สามารถโหลดข้อมูลบัญชีผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOpenEditModal = (u: UserProfile) => {
    setSelectedUser(u);
    setEditRole(u.role);
    setEditStatus(u.status);
    setEditDepartment(u.department || "");
    setEditPosition(u.position || u.roleTitle || "");
    setEditEmployeeId(u.employeeId || "");
    setEditReason("");
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!editReason.trim()) {
      showToast("error", "กรุณาระบุเหตุผลในการปรับปรุงสิทธิ์หรือสถานะบัญชีเพื่อบันทึกประวัติ (Audit Log)");
      return;
    }

    try {
      setUpdating(true);
      await updateUserProfile(
        selectedUser.id,
        {
          role: editRole,
          status: editStatus,
          department: editDepartment,
          position: editPosition,
          employeeId: editEmployeeId
        },
        editReason,
        currentUser
      );
      showToast("success", `ปรับปรุงข้อมูลบัญชีของ ${selectedUser.name} เรียบร้อยแล้ว`);
      setSelectedUser(null);
      await loadAllData();
    } catch (err: any) {
      console.error("Update user error:", err);
      showToast("error", err.message || "เกิดข้อผิดพลาดในการปรับปรุงข้อมูล");
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveUser = async (u: UserProfile) => {
    try {
      await approvePendingUser(u.id, u.requestedRole || u.role || "lecturer", u.employeeId, currentUser);
      showToast("success", `อนุมัติเปิดใช้งานบัญชีของ ${u.name} เรียบร้อยแล้ว`);
      await loadAllData();
    } catch (err: any) {
      showToast("error", err.message || "ไม่สามารถอนุมัติได้");
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) {
      showToast("error", "กรุณากรอกอีเมลและชื่อบุคลากร");
      return;
    }

    try {
      setInviting(true);
      await createAccountInvitation(
        {
          email: inviteEmail,
          employeeId: inviteEmployeeId || `EMP-2569-${Date.now().toString().slice(-3)}`,
          employeeName: inviteName,
          intendedRole: inviteRole,
          department: inviteDepartment,
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          invitedBy: currentUser?.id || "u-admin",
          invitedByName: currentUser?.name || "ผู้ดูแลระบบ"
        },
        currentUser
      );
      showToast("success", `ส่งคำเชิญไปยัง ${inviteEmail} เรียบร้อยแล้ว (ลิงก์มีอายุ 7 วัน)`);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteName("");
      setInviteEmployeeId("");
      await loadAllData();
    } catch (err: any) {
      showToast("error", err.message || "ไม่สามารถสร้างคำเชิญได้");
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (invId: string) => {
    if (!confirm("ต้องการยกเลิกคำเชิญนี้ใช่หรือไม่?")) return;
    try {
      await revokeAccountInvitation(invId, currentUser);
      showToast("success", "ยกเลิกคำเชิญเรียบร้อยแล้ว");
      await loadAllData();
    } catch (err: any) {
      showToast("error", "ไม่สามารถยกเลิกคำเชิญได้");
    }
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const matchQuery = !searchQuery || 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    return matchQuery && matchRole && matchStatus;
  });

  const pendingUsersCount = users.filter(u => u.status === "pending_approval").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-blue-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> หน้าหลัก
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-blue-900">ผู้ดูแลระบบ</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ระบบจัดการบัญชีผู้ใช้และสิทธิ์ (User Accounts & Roles)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ควบคุมการเข้าถึงระบบ กำหนดบทบาท 8 ฝ่าย และอนุมัติเปิดใช้งานบัญชีบุคลากร (Super Admin)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>เชิญบุคลากรใหม่ (Invite)</span>
        </button>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-fadeIn ${
          toastMessage.type === "success" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"
        }`}>
          {toastMessage.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "users"
              ? "border-blue-900 text-blue-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>บัญชีผู้ใช้ทั้งหมด ({users.length})</span>
          {pendingUsersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {pendingUsersCount} รออนุมัติ
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("invitations")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "invitations"
              ? "border-blue-900 text-blue-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>คำเชิญเข้าใช้งาน ({invitations.filter(i => i.status === "pending").length} ค้างอยู่)</span>
        </button>
      </div>

      {activeTab === "users" ? (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหาตามชื่อ, อีเมล, หรือรหัสบุคลากร..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:border-blue-900 focus:outline-none bg-white text-slate-700"
              >
                <option value="all">ทุกบทบาท (All Roles)</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:border-blue-900 focus:outline-none bg-white text-slate-700"
              >
                <option value="all">ทุกสถานะ (All Status)</option>
                <option value="active">ใช้งานปกติ (Active)</option>
                <option value="pending_approval">รออนุมัติ (Pending)</option>
                <option value="suspended">ระงับการใช้งาน (Suspended)</option>
              </select>

              <button
                type="button"
                onClick={loadAllData}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-3 px-4 font-semibold">บุคลากร / รหัส</th>
                    <th className="py-3 px-4 font-semibold">อีเมลติดต่อ</th>
                    <th className="py-3 px-4 font-semibold">หน่วยงาน / ตำแหน่ง</th>
                    <th className="py-3 px-4 font-semibold">บทบาทในระบบ</th>
                    <th className="py-3 px-4 font-semibold">สถานะบัญชี</th>
                    <th className="py-3 px-4 font-semibold text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                        <span>กำลังโหลดข้อมูลบัญชีผู้ใช้...</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลบัญชีผู้ใช้ตามเงื่อนไขที่ค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const roleMeta = ROLE_OPTIONS.find(r => r.value === u.role);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  u.name.charAt(0)
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{u.name}</p>
                                <p className="text-[10px] font-mono text-slate-400">{u.employeeId || "ยังไม่ผูกรหัส"}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-600">
                            {u.email}
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900 line-clamp-1">{u.department || "-"}</p>
                            <p className="text-[10px] text-slate-500">{u.position || u.roleTitle}</p>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              u.role === "admin" 
                                ? "bg-purple-100 text-purple-900" 
                                : u.role === "dean" 
                                ? "bg-blue-100 text-blue-900" 
                                : u.role.startsWith("staff_") 
                                ? "bg-amber-100 text-amber-900" 
                                : "bg-slate-100 text-slate-800"
                            }`}>
                              {roleMeta?.label.split(" ")[0] || u.role}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : u.status === "pending_approval"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}>
                              {u.status === "active" ? "ใช้งานปกติ" : u.status === "pending_approval" ? "รออนุมัติ" : "ถูกระงับ"}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right space-x-2">
                            {u.status === "pending_approval" ? (
                              <button
                                type="button"
                                onClick={() => handleApproveUser(u)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>อนุมัติใช้งาน</span>
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(u)}
                              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] rounded-lg transition-colors"
                            >
                              จัดการสิทธิ์ →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Invitations Tab */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-4 font-semibold">อีเมลผู้รับเชิญ</th>
                  <th className="py-3 px-4 font-semibold">ชื่อบุคลากร / รหัส</th>
                  <th className="py-3 px-4 font-semibold">บทบาทและหน่วยงาน</th>
                  <th className="py-3 px-4 font-semibold">ผู้เชิญ / วันที่</th>
                  <th className="py-3 px-4 font-semibold">สถานะคำเชิญ</th>
                  <th className="py-3 px-4 font-semibold text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invitations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      ยังไม่มีรายการคำเชิญเข้าใช้งาน
                    </td>
                  </tr>
                ) : (
                  invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {inv.email}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{inv.employeeName}</p>
                        <p className="text-[10px] font-mono text-slate-400">{inv.employeeId}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-blue-900">{inv.intendedRole}</p>
                        <p className="text-[10px] text-slate-500">{inv.department}</p>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        <div>{inv.invitedByName}</div>
                        <div className="text-[10px] text-slate-400">{new Date(inv.createdAt).toLocaleDateString("th-TH")}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === "pending" 
                            ? "bg-amber-100 text-amber-800" 
                            : inv.status === "accepted" 
                            ? "bg-emerald-100 text-emerald-800" 
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {inv.status === "pending" ? "รอยืนยัน" : inv.status === "accepted" ? "ยอมรับแล้ว" : "ยกเลิก/หมดอายุ"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {inv.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleRevokeInvite(inv.id)}
                            className="text-rose-600 hover:text-rose-800 font-semibold text-xs"
                          >
                            ยกเลิกคำเชิญ
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. Modal: Invite New User */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">เชิญบุคลากรเข้าใช้งานระบบ</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">อีเมลผู้รับเชิญ (@cpru.ac.th)</label>
                <input
                  type="email"
                  placeholder="เช่น employee@cpru.ac.th"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อ-สกุลบุคลากร</label>
                  <input
                    type="text"
                    placeholder="เช่น อาจารย์ ดร.สมชาย ทรงคุณ"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสบุคลากรถาวร</label>
                  <input
                    type="text"
                    placeholder="เช่น EMP-2569-009"
                    value={inviteEmployeeId}
                    onChange={(e) => setInviteEmployeeId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หน่วยงาน / สาขาวิชา</label>
                <input
                  type="text"
                  value={inviteDepartment}
                  onChange={(e) => setInviteDepartment(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">บทบาทที่มอบหมาย</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none bg-white"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] text-blue-900 space-y-1">
                <p className="font-semibold">เงื่อนไขการส่งคำเชิญ:</p>
                <p className="text-slate-600">• ระบบจะสร้างโทเค็นคำเชิญแบบใช้ครั้งเดียว มีอายุ 7 วัน</p>
                <p className="text-slate-600">• เมื่อบุคลากรตอบรับและตั้งรหัสผ่าน บัญชีจะเปิดใช้งานตามสิทธิ์ที่กำหนดทันที</p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold rounded-lg shadow-sm"
                >
                  {inviting ? "กำลังส่งคำเชิญ..." : "ส่งคำเชิญ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Edit User & Role Management */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">จัดการบทบาทและสิทธิ์ผู้ใช้</h3>
                  <p className="text-[11px] text-slate-500">{selectedUser.name} ({selectedUser.email})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสบุคลากรถาวร</label>
                  <input
                    type="text"
                    value={editEmployeeId}
                    onChange={(e) => setEditEmployeeId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={editPosition}
                    onChange={(e) => setEditPosition(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หน่วยงาน / สาขาวิชา</label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">บทบาทและสิทธิ์ในระบบ (Role)</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none bg-white font-medium text-slate-800"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {ROLE_OPTIONS.find(r => r.value === editRole)?.desc}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">สถานะบัญชี (Account Status)</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as UserAccountStatus)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none bg-white font-medium text-slate-800"
                >
                  <option value="active">เปิดใช้งานปกติ (Active)</option>
                  <option value="pending_approval">รออนุมัติสิทธิ์ (Pending Approval)</option>
                  <option value="suspended">ระงับการใช้งาน (Suspended)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <label className="block font-bold text-amber-900">
                  เหตุผลในการปรับปรุงข้อมูล / เปลี่ยนสิทธิ์ (จำเป็นต้องระบุ):
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุเหตุผล เช่น มอบหมายหน้าที่รองคณบดี, ปรับตำแหน่งตามคำสั่งคณะที่..."
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full border border-amber-300 rounded-lg p-2 focus:border-amber-500 focus:outline-none bg-white text-xs"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold rounded-lg shadow-sm"
                >
                  {updating ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
