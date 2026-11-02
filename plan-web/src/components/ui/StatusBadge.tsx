import { ProjectStatus } from "../../types/plan"
import { statusLabels, statusTones } from "../../lib/formatters"

interface StatusBadgeProps {
  status: ProjectStatus | string
  className?: string
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const tone = statusTones[status as ProjectStatus] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
  }
  const label = statusLabels[status as ProjectStatus] || status

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.bg} ${tone.text} ${tone.border ? `border ${tone.border}` : ""} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${tone.dot}`} />
      {label}
    </span>
  )
}
