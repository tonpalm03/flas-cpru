import { KeyboardEvent, useMemo, useState } from "react"
import { PlanProject } from "../../types/plan"
import { SessionUser, roleLabels } from "../../lib/currentUser"
import { initials, searchProjects } from "../../lib/projectSearch"
import { authService } from "../../services/authService"
import { Icon } from "../ui/Icons"
import { StatusBadge } from "../ui/StatusBadge"
import { ChangePasswordDialog } from "./ChangePasswordDialog"

interface HeaderProps {
  user: SessionUser
  /** โครงการที่ผู้ใช้เห็นได้ — ใช้ค้นหาจากแถบด้านบน */
  projects: PlanProject[]
  onSelectProject: (project: PlanProject) => void
}

/** แถบด้านบนของจอใหญ่ (มือถือใช้ MobileTopBar) */
export function Header({ user, projects, onSelectProject }: HeaderProps) {
  const [changingPassword, setChangingPassword] = useState(false)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  const results = useMemo(() => searchProjects(projects, query), [projects, query])

  const choose = (project: PlanProject) => {
    onSelectProject(project)
    setQuery("")
    setOpen(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && results[0]) choose(results[0])
    if (event.key === "Escape") {
      setQuery("")
      setOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-6 backdrop-blur-md">
      {/* ค้นหาโครงการจากทุกหน้า */}
      <div className="relative min-w-0 flex-1 max-w-md">
        <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          data-testid="header-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="ค้นหาโครงการ รหัส หรือผู้รับผิดชอบ"
          className="w-full rounded-xl border border-line-strong bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        {open && query.trim() && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-96 overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-lg">
            {results.length === 0 ? (
              <div className="px-3 py-3 text-xs text-muted">ไม่พบโครงการที่ตรงกับ "{query.trim()}"</div>
            ) : (
              results.map((project) => (
                <button
                  key={project.id}
                  data-testid="search-result"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(project)}
                  className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left hover:bg-surface"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{project.name}</span>
                    <span className="block text-[11px] text-muted">
                      <span className="font-mono">{project.id}</span> · {project.owner} · {project.unit}
                    </span>
                  </span>
                  <StatusBadge status={project.status} className="shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* ผู้ใช้ + บัญชี */}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-brand text-sm font-bold text-white">
            {initials(user.display_name)}
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-ink" data-testid="current-user-name">
              {user.display_name}
            </div>
            <div className="text-[11px] text-muted">
              {roleLabels[user.role].short}
              {user.department ? ` · ${user.department}` : ""}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setChangingPassword(true)}
          className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-muted hover:bg-black/5"
        >
          เปลี่ยนรหัสผ่าน
        </button>
        <button
          type="button"
          onClick={() => authService.logout()}
          className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-brand hover:bg-brand/5"
        >
          ออกจากระบบ
        </button>
      </div>

      {changingPassword && <ChangePasswordDialog onClose={() => setChangingPassword(false)} />}
    </header>
  )
}
