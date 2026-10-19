"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Lock, ShieldCheck, X } from "lucide-react";
import { useRole } from "@/components/RoleContext";
import {
  AdminModuleKey,
  DEFAULT_MODULE_PERMISSIONS,
  MODULE_ROLE_OPTIONS,
  ModulePermissionConfig,
  canUserEditModule,
  getModulePermission,
  saveModulePermission
} from "@/lib/modulePermissionService";
import { getUserRoles } from "@/lib/workflowPermissionService";

interface AdminModuleShellProps {
  moduleKey: AdminModuleKey;
  title: string;
  subtitle: string;
  /** ปุ่มดำเนินการด้านขวาของหัวเรื่อง (แสดงเฉพาะผู้มีสิทธิ์แก้ไข) */
  actions?: (canEdit: boolean) => React.ReactNode;
  children: (access: { canEdit: boolean }) => React.ReactNode;
}

/** กรอบมาตรฐานของโมดูลธุรการ: หัวเรื่อง สถานะสิทธิ์ของผู้ใช้ และหน้าต่างกำหนดสิทธิ์ (แอดมิน) */
export default function AdminModuleShell({ moduleKey, title, subtitle, actions, children }: AdminModuleShellProps) {
  const { currentUser } = useRole();
  const [config, setConfig] = useState<ModulePermissionConfig>(DEFAULT_MODULE_PERMISSIONS[moduleKey]);
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    let active = true;
    getModulePermission(moduleKey).then(c => {
      if (active) setConfig(c);
    });
    return () => {
      active = false;
    };
  }, [moduleKey]);

  const canEdit = canUserEditModule(currentUser, config);
  const isAdmin = !!currentUser && (currentUser.role === "admin" || getUserRoles(currentUser).includes("แอดมิน"));

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 border bg-slate-50 text-slate-600 border-slate-200">
            {canEdit ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
            {canEdit ? "คุณมีสิทธิ์แก้ไขโมดูลนี้" : "ดูได้อย่างเดียว"}
            <span className="font-normal text-slate-500">| ผู้แก้ไขได้: {config.editorRoles.join(", ")}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {actions?.(canEdit)}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowPermissions(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              <ShieldCheck className="w-4 h-4" />
              กำหนดสิทธิ์การแก้ไข
            </button>
          )}
        </div>
      </div>

      {children({ canEdit })}

      {showPermissions && currentUser && (
        <PermissionDialog
          moduleKey={moduleKey}
          title={title}
          initial={config.editorRoles}
          onClose={() => setShowPermissions(false)}
          onSaved={setConfig}
        />
      )}
    </div>
  );
}

function PermissionDialog({
  moduleKey,
  title,
  initial,
  onClose,
  onSaved
}: {
  moduleKey: AdminModuleKey;
  title: string;
  initial: string[];
  onClose: () => void;
  onSaved: (c: ModulePermissionConfig) => void;
}) {
  const { currentUser } = useRole();
  const [selected, setSelected] = useState<string[]>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = useCallback((role: string) => {
    setSelected(prev => (prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]));
  }, []);

  const save = async () => {
    if (!currentUser) return;
    setSaving(true);
    setError("");
    try {
      const saved = await saveModulePermission(moduleKey, selected, currentUser);
      onSaved(saved);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">กำหนดสิทธิ์การแก้ไข</h2>
            <p className="text-xs text-slate-500">{title}: ทุกคนที่เข้าสู่ระบบดูได้ เลือกยศที่แก้ไขได้ (เพิ่ม แก้ไข ลบ เผยแพร่)</p>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MODULE_ROLE_OPTIONS.map(role => {
            const locked = role === "แอดมิน";
            const checked = locked || selected.includes(role);
            return (
              <label
                key={role}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${
                  checked ? "border-blue-900 bg-blue-50 text-blue-900" : "border-slate-200 text-slate-700"
                } ${locked ? "opacity-80" : "cursor-pointer"}`}
              >
                <input type="checkbox" checked={checked} disabled={locked} onChange={() => toggle(role)} />
                <span>{role}</span>
              </label>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500">แอดมินแก้ไขได้เสมอและไม่สามารถยกเลิกได้</p>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700">
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-blue-900 text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกสิทธิ์"}
          </button>
        </div>
      </div>
    </div>
  );
}
