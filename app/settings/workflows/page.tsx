"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  Save,
  CheckCircle2,
  Users,
  KeyRound,
  FileText,
  Send,
  PenLine,
  Eye,
  Download,
  Trash2,
  Plus,
  Sliders,
  AlertCircle,
  HelpCircle,
  Clock,
  UserCheck,
  UserPlus
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { getAllUsers } from "@/lib/firebaseService";
import { getAdminCategories } from "@/lib/adminCategoryService";
import {
  getWorkflowConfig,
  saveWorkflowConfig,
  DEFAULT_WORKFLOW_CONFIGS
} from "@/lib/workflowPermissionService";
import type { 
  UserProfile, 
  AdminDocCategoryConfig, 
  DocumentWorkflowConfig,
  SequentialSignerStep
} from "@/lib/types";

const ALL_ROLES = [
  "แอดมิน",
  "คณบดี",
  "รองคณบดี",
  "ผู้บริหาร",
  "ประธานสาขา",
  "ธุรการ",
  "การเงิน",
  "พัสดุ",
  "แผนงาน",
  "บุคคล",
  "อาจารย์",
  "เจ้าหน้าที่"
];

export default function WorkflowsSettingsPage() {
  const { currentUser, isAdmin } = useRole();
  const [categories, setCategories] = useState<AdminDocCategoryConfig[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("memo");
  const [config, setConfig] = useState<DocumentWorkflowConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load all categories, users, and initial workflow config
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catList, userList] = await Promise.all([
          getAdminCategories(),
          getAllUsers()
        ]);
        setCategories(catList);
        setUsers(userList);

        const initialConfig = await getWorkflowConfig("memo");
        setConfig(initialConfig);
      } catch (err: any) {
        setNotice({ type: "error", text: "โหลดข้อมูลไม่สำเร็จ: " + err.message });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // When changing selected category
  const handleSelectCategory = async (catId: string) => {
    setSelectedCatId(catId);
    try {
      setLoading(true);
      const conf = await getWorkflowConfig(catId);
      setConfig(conf);
    } catch (err: any) {
      setNotice({ type: "error", text: "โหลดการตั้งค่าไม่สำเร็จ: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const toggleRoleInGroup = (groupKey: keyof Pick<DocumentWorkflowConfig, 'reviewers' | 'numberers' | 'signSubmitters' | 'viewers' | 'downloaders'>, roleName: string) => {
    if (!config) return;
    const currentRoles = config[groupKey]?.roles || [];
    const exists = currentRoles.includes(roleName);
    const updated = exists ? currentRoles.filter(r => r !== roleName) : [...currentRoles, roleName];
    setConfig({
      ...config,
      [groupKey]: {
        ...config[groupKey],
        roles: updated
      }
    });
  };

  const toggleUserInGroup = (groupKey: keyof Pick<DocumentWorkflowConfig, 'reviewers' | 'numberers' | 'signSubmitters' | 'viewers' | 'downloaders'>, userId: string) => {
    if (!config) return;
    const currentUsers = config[groupKey]?.userIds || [];
    const exists = currentUsers.includes(userId);
    const updated = exists ? currentUsers.filter(u => u !== userId) : [...currentUsers, userId];
    setConfig({
      ...config,
      [groupKey]: {
        ...config[groupKey],
        userIds: updated
      }
    });
  };

  const toggleSignerRole = (roleName: string) => {
    if (!config) return;
    const currentRoles = config.signers?.roles || [];
    const exists = currentRoles.includes(roleName);
    const updated = exists ? currentRoles.filter(r => r !== roleName) : [...currentRoles, roleName];
    setConfig({
      ...config,
      signers: {
        ...config.signers,
        roles: updated
      }
    });
  };

  const toggleSignerUser = (userId: string) => {
    if (!config) return;
    const currentUsers = config.signers?.userIds || [];
    const exists = currentUsers.includes(userId);
    const updated = exists ? currentUsers.filter(u => u !== userId) : [...currentUsers, userId];
    setConfig({
      ...config,
      signers: {
        ...config.signers,
        userIds: updated
      }
    });
  };

  // Add sequential signer step
  const addSequentialStep = () => {
    if (!config) return;
    const steps = config.signers?.sequentialSteps || [];
    const newStep = {
      step: steps.length + 1,
      title: steps.length === 0 ? "รองคณบดีฝ่ายวิชาการ" : "คณบดี",
      role: steps.length === 0 ? "รองคณบดี" : "คณบดี"
    };
    setConfig({
      ...config,
      signers: {
        ...config.signers,
        mode: "sequential",
        sequentialSteps: [...steps, newStep]
      }
    });
  };

  const removeSequentialStep = (index: number) => {
    if (!config || !config.signers?.sequentialSteps) return;
    const nextSteps = config.signers.sequentialSteps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, step: i + 1 }));
    setConfig({
      ...config,
      signers: {
        ...config.signers,
        sequentialSteps: nextSteps
      }
    });
  };

  // Save changes
  const handleSave = async () => {
    if (!currentUser || !config) return;
    try {
      setSaving(true);
      const saved = await saveWorkflowConfig(config, currentUser);
      setConfig(saved);
      showNotice("success", `บันทึกขั้นตอนงานและสิทธิ์สำหรับ "${config.title || selectedCatId}" เรียบร้อยแล้ว`);
    } catch (err: any) {
      showNotice("error", "ไม่สามารถบันทึกได้: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <Link
            href="/settings/users"
            className="text-xs text-blue-900 font-semibold hover:underline flex items-center gap-1 mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าจัดการบัญชีผู้ใช้
          </Link>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-900" />
            <span>ตั้งค่าขั้นตอนงานและสิทธิ์ (Workflows & Permissions)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดผู้รับหน้าที่ตรวจ ออกเลขทะเบียน ส่งลงนาม ลงนาม และสิทธิ์เข้าถึงแยกตามโมดูล/หมวดเอกสาร
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isAdmin}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-emerald-300" />
            <span>{saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-sm ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Categories Selector Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCatId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-blue-900 text-white shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${isSelected ? "text-blue-200" : "text-slate-400"}`} />
              <span>{cat.title}</span>
            </button>
          );
        })}
      </div>

      {loading || !config ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-500 gap-3">
          <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold">กำลังโหลดการตั้งค่าขั้นตอนงาน...</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* STEP 1: ผู้รับหน้าที่ตรวจ (Reviewers) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">ผู้รับหน้าที่ตรวจ (Reviewers)</h2>
                  <p className="text-[11px] text-slate-500">มีสิทธิ์ตรวจทานเนื้อหาและจัดหน้ากระดาษ</p>
                </div>
              </div>
            </div>

            {/* Role Checkboxes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">กำหนดตามบทบาท (Roles):</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_ROLES.map((role) => {
                  const checked = config.reviewers?.roles?.includes(role) ?? false;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRoleInGroup("reviewers", role)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        checked
                          ? "bg-amber-100 border-amber-300 text-amber-950 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${checked ? "text-amber-700" : "opacity-0"}`} />
                      <span>{role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specific User IDs Selection */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 block">
                หรือมอบหมายบุคคลเฉพาะราย (Specific Users):
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                {users.map((u) => {
                  const checked = config.reviewers?.userIds?.includes(u.id) ?? false;
                  return (
                    <label key={u.id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUserInGroup("reviewers", u.id)}
                        className="rounded text-blue-900"
                      />
                      <span className="font-medium text-slate-800">{u.name}</span>
                      <span className="text-[10px] text-slate-400">({u.position || u.role})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 1.5: ผู้ออกเลขทะเบียน (Numberers) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  #
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">ผู้ออกเลขทะเบียนหนังสือ (Numbering Authority)</h2>
                  <p className="text-[11px] text-slate-500">แยกต่างหากจากผู้ช่วยตรวจ (เพิ่มการเงินช่วยตรวจจะไม่ออกเลขได้เอง)</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">กำหนดตามบทบาท (Roles):</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_ROLES.map((role) => {
                  const checked = config.numberers?.roles?.includes(role) ?? false;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRoleInGroup("numberers", role)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        checked
                          ? "bg-blue-100 border-blue-300 text-blue-950 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${checked ? "text-blue-700" : "opacity-0"}`} />
                      <span>{role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 block">
                หรือระบุบุคคลเฉพาะรายที่มีสิทธิ์ออกเลข:
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                {users.map((u) => {
                  const checked = config.numberers?.userIds?.includes(u.id) ?? false;
                  return (
                    <label key={u.id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUserInGroup("numberers", u.id)}
                        className="rounded text-blue-900"
                      />
                      <span className="font-medium text-slate-800">{u.name}</span>
                      <span className="text-[10px] text-slate-400">({u.position || u.role})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 2: ผู้มีสิทธิ์ส่งลงนาม (Sign Submitters) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">ผู้มีสิทธิ์ส่งลงนาม (Send to Sign)</h2>
                  <p className="text-[11px] text-slate-500">เปลี่ยนสถานะจาก "รอตรวจ" ไปยัง "รอลงนาม" และล็อคไฟล์ Word</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">กำหนดตามบทบาท (Roles):</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_ROLES.map((role) => {
                  const checked = config.signSubmitters?.roles?.includes(role) ?? false;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRoleInGroup("signSubmitters", role)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        checked
                          ? "bg-indigo-100 border-indigo-300 text-indigo-950 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${checked ? "text-indigo-700" : "opacity-0"}`} />
                      <span>{role}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 3: ผู้มีอำนาจลงนาม (Signers & Sequential Multi-Sign) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">ผู้มีอำนาจลงนาม e-Signature</h2>
                  <p className="text-[11px] text-slate-500">รองรับทั้งคนใดคนหนึ่งลงนาม หรือลงนามตามลำดับหลายคน</p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, signers: { ...config.signers, mode: "single" } })}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    config.signers?.mode === "single"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  คนใดคนหนึ่ง
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, signers: { ...config.signers, mode: "sequential" } })}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    config.signers?.mode === "sequential"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  หลายคนตามลำดับ
                </button>
              </div>
            </div>

            {config.signers?.mode === "single" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">บทบาทผู้ลงนาม (Roles):</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_ROLES.map((role) => {
                      const checked = config.signers?.roles?.includes(role) ?? false;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleSignerRole(role)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            checked
                              ? "bg-emerald-100 border-emerald-300 text-emerald-950 shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${checked ? "text-emerald-700" : "opacity-0"}`} />
                          <span>{role}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">หรือระบุผู้ลงนามเฉพาะราย:</label>
                  <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    {users.map((u) => {
                      const checked = config.signers?.userIds?.includes(u.id) ?? false;
                      return (
                        <label key={u.id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSignerUser(u.id)}
                            className="rounded text-emerald-900"
                          />
                          <span className="font-medium text-slate-800">{u.name}</span>
                          <span className="text-[10px] text-slate-400">({u.position || u.role})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">ลำดับขั้นตอนการลงนาม (Signer Steps):</span>
                  <button
                    type="button"
                    onClick={addSequentialStep}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold rounded-lg border border-emerald-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> เพิ่มลำดับ
                  </button>
                </div>

                <div className="space-y-2">
                  {(config.signers?.sequentialSteps || []).map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        {step.step}
                      </span>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => {
                          const steps = [...(config.signers?.sequentialSteps || [])];
                          steps[idx].title = e.target.value;
                          setConfig({ ...config, signers: { ...config.signers, sequentialSteps: steps } });
                        }}
                        placeholder="ชื่อตำแหน่งขั้นตอน..."
                        className="flex-1 rounded-lg border border-slate-200 p-1.5 text-xs font-medium"
                      />
                      <select
                        value={step.role || ""}
                        onChange={(e) => {
                          const steps = [...(config.signers?.sequentialSteps || [])];
                          steps[idx].role = e.target.value;
                          setConfig({ ...config, signers: { ...config.signers, sequentialSteps: steps } });
                        }}
                        className="rounded-lg border border-slate-200 p-1.5 text-xs bg-white"
                      >
                        <option value="">ทุกบทบาทผู้บริหาร</option>
                        {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeSequentialStep(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ผู้ร่างลงนามเอกสารของตนเอง: ค่าเริ่มต้นปิด ผู้ที่ถูกติ๊กชื่อเฉพาะรายลงนามเอกสารของตนเองได้เสมอ */}
            <label className="flex items-start gap-2 pt-3 border-t border-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={config.allowCreatorSelfSign ?? false}
                onChange={(e) => setConfig({ ...config, allowCreatorSelfSign: e.target.checked })}
                className="mt-0.5 rounded text-emerald-900"
              />
              <span>
                <span className="text-xs font-semibold text-slate-800 block">อนุญาตให้ผู้ร่างลงนามเอกสารของตนเอง</span>
                <span className="text-[11px] text-slate-500">
                  ปิดไว้: ผู้ร่างลงนามเอกสารที่ตนสร้างไม่ได้ ยกเว้นคณบดี/รองคณบดี/ผู้บริหาร และผู้ที่ถูกระบุชื่อเฉพาะรายด้านบน
                </span>
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
