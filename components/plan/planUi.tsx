"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PlanStatus } from "@/lib/planModel";
import { PLAN_STATUS_LABELS } from "@/lib/planModel";

export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 disabled:bg-slate-50 disabled:text-slate-500";

export function Field({
  label,
  required,
  hint,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-[11px] font-bold text-slate-700">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[10px] text-slate-500">{hint}</span>}
    </label>
  );
}

export function SectionCard({ title, description, action, children }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {description && <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-blue-900 hover:bg-blue-50"
    >
      <Plus className="w-3.5 h-3.5" />
      <span>{children}</span>
    </button>
  );
}

export function RemoveButton({ onClick, label = "ลบ" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

/** รายการข้อความหลายบรรทัด เช่น ผลประโยชน์ การประเมินผล วิธีดำเนินงาน */
export function StringList({
  values,
  onChange,
  prefix,
  placeholder,
  addLabel,
  disabled,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  prefix: (index: number) => string;
  placeholder: string;
  addLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {values.map((value, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-9 shrink-0 text-[11px] font-semibold text-slate-500">{prefix(i)}</span>
          <input
            className={inputClass}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            onChange={e => onChange(values.map((v, j) => (j === i ? e.target.value : v)))}
          />
          {!disabled && values.length > 1 && <RemoveButton onClick={() => onChange(values.filter((_, j) => j !== i))} />}
        </div>
      ))}
      {!disabled && <AddButton onClick={() => onChange([...values, ""])}>{addLabel}</AddButton>}
    </div>
  );
}

const STATUS_STYLES: Record<PlanStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  PENDING_REVIEW: "bg-amber-50 text-amber-800 border-amber-200",
  REVISION_REQUESTED: "bg-orange-50 text-orange-800 border-orange-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  APPROVED_FOR_PRINT: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export function PlanStatusBadge({ status }: { status: PlanStatus }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[status]}`}>
      {PLAN_STATUS_LABELS[status]}
    </span>
  );
}

export function ErrorList({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-1">
      {errors.map((e, i) => (
        <div key={i}>{e}</div>
      ))}
    </div>
  );
}
