import { KeyboardEvent, useMemo, useState } from "react"
import { PlanProject } from "../../types/plan"
import { useBackLayer } from "../../lib/backLayers"
import { formatMoney } from "../../lib/formatters"
import { searchProjects } from "../../lib/projectSearch"
import { Icon } from "../ui/Icons"
import { StatusBadge } from "../ui/StatusBadge"

interface MobileSearchProps {
  open: boolean
  onClose: () => void
  projects: PlanProject[]
  onSelectProject: (project: PlanProject) => void
}

/** หน้าค้นหาโครงการเต็มจอของมือถือ */
export function MobileSearch({ open, onClose, projects, onSelectProject }: MobileSearchProps) {
  useBackLayer(open, onClose)
  // เปิดใหม่ = เริ่มช่องค้นหาว่าง
  return open ? <SearchPanel onClose={onClose} projects={projects} onSelectProject={onSelectProject} /> : null
}

function SearchPanel({ onClose, projects, onSelectProject }: Omit<MobileSearchProps, "open">) {
  const [query, setQuery] = useState("")
  const results = useMemo(() => searchProjects(projects, query, 30), [projects, query])

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && results[0]) onSelectProject(results[0])
    if (event.key === "Escape") onClose()
  }

  return (
    <div data-testid="mobile-search" className="fixed inset-0 z-50 flex flex-col bg-white pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-line px-2">
        <button type="button" onClick={onClose} aria-label="ปิดการค้นหา" className="grid size-11 shrink-0 place-items-center rounded-full text-ink active:bg-surface">
          <Icon name="back" size={24} />
        </button>
        <input
          data-testid="header-search"
          autoFocus
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="ค้นหาชื่อโครงการ รหัส หรือผู้รับผิดชอบ"
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-ink placeholder:text-muted focus:outline-none"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="ล้างคำค้น" className="grid size-11 shrink-0 place-items-center rounded-full text-muted active:bg-surface">
            <Icon name="close" size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!query.trim() ? (
          <div className="px-6 py-12 text-center text-sm text-muted">
            <Icon name="search" size={36} className="mx-auto mb-3 text-line-strong" />
            พิมพ์ชื่อโครงการ รหัส (เช่น PRJ-2570-001) ชื่อผู้รับผิดชอบ หรือสาขาวิชา
          </div>
        ) : results.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted">ไม่พบโครงการที่ตรงกับ "{query.trim()}"</div>
        ) : (
          <div className="divide-y divide-line">
            {results.map((project) => (
              <button
                key={project.id}
                type="button"
                data-testid="search-result"
                onClick={() => onSelectProject(project)}
                className="block w-full px-4 py-3 text-left active:bg-surface"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted">{project.id}</span>
                  <StatusBadge status={project.status} />
                </div>
                <div className="mt-1 text-[15px] font-semibold text-ink">{project.name}</div>
                <div className="mt-0.5 flex justify-between gap-2 text-xs text-muted">
                  <span className="truncate">
                    {project.owner} · {project.unit}
                  </span>
                  <span className="shrink-0 font-mono">฿{formatMoney(project.amount)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
