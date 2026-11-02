import React from "react"

export interface TabItem<T extends string> {
  id: T
  label: string
  /** ตัวเลขหรือป้ายเล็กท้ายชื่อแท็บ */
  badge?: React.ReactNode
  testId?: string
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  className?: string
}

/** แถบแท็บแบบเดียวกันทุกหน้า — บนมือถือเลื่อนซ้ายขวาได้ */
export function Tabs<T extends string>({ tabs, value, onChange, className = "" }: TabsProps<T>) {
  return (
    <div role="tablist" className={`flex gap-1 overflow-x-auto border-b border-line ${className}`}>
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={tab.testId}
            onClick={() => onChange(tab.id)}
            className={`-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-bold transition-colors ${
              active ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge !== null && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-brand-soft text-brand" : "bg-surface text-muted"}`}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
