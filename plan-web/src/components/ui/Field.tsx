import React from "react"

interface FieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className = "",
}: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  )
}
