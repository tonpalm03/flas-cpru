import { Icon } from "../ui/Icons"
import { Button } from "../ui/Button"
import { CpruProjectFormData, ProjectOKRItem } from "../../types/plan"

interface OkrTableProps {
  okrs: ProjectOKRItem[]
  onChange: (okrs: ProjectOKRItem[]) => void
}

export function newOkr(values: Partial<ProjectOKRItem> = {}): ProjectOKRItem {
  return {
    id: `okr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    objective: "",
    keyResult: "",
    target: "",
    ...values,
  }
}

/**
 * OKR ของโครงการ (ข้อ 6) — จำนวนแถวไม่ผูกกับจำนวนกิจกรรม
 * ร่างรุ่นก่อนเก็บ OKR ไว้ในกิจกรรม (objective/okrKeyResult/okrTarget) จึงย้ายมาเป็นแถวให้
 */
export function okrsFromForm(form?: CpruProjectFormData): ProjectOKRItem[] {
  const filled = (o: Partial<ProjectOKRItem>) => Boolean(o.objective || o.keyResult || o.target)
  const saved = (form?.okrs || []).filter(filled)
  if (saved.length > 0) return saved.map((o) => newOkr(o))
  const legacy = (form?.activityDefinitions || [])
    .map((a) => ({ objective: a.objective || "", keyResult: a.okrKeyResult || "", target: a.okrTarget || "" }))
    .filter(filled)
  if (legacy.length > 0) return legacy.map((o) => newOkr(o))
  return [newOkr()]
}

export function incompleteOkrRows(okrs: ProjectOKRItem[]): number[] {
  return okrs
    .map((o, index) => (o.objective.trim() && o.keyResult.trim() && o.target.trim() ? 0 : index + 1))
    .filter((row) => row > 0)
}

export function OkrTable({ okrs, onChange }: OkrTableProps) {
  const update = (id: string, updates: Partial<ProjectOKRItem>) =>
    onChange(okrs.map((o) => (o.id === id ? { ...o, ...updates } : o)))
  const remove = (id: string) => onChange(okrs.filter((o) => o.id !== id))

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900">ข้อ 6. วัตถุประสงค์ ผลลัพธ์หลัก (OKR) และค่าเป้าหมาย</h4>
          <p className="text-[11px] text-slate-500">
            ใส่ได้ตามจำนวนที่โครงการมี ไม่ต้องเท่ากับจำนวนกิจกรรม (แบบฟอร์มเว้นไว้ 3 แถว)
          </p>
        </div>
        <Button variant="outline" size="sm" icon="plus" type="button" onClick={() => onChange([...okrs, newOkr()])}>
          + เพิ่มวัตถุประสงค์
        </Button>
      </div>

      <div className="space-y-3">
        {okrs.map((okr, index) => (
          <div key={okr.id} data-testid="okr-row" className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <span className="mt-6 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
              {index + 1}
            </span>
            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-[2fr_2fr_1fr]">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-slate-600">วัตถุประสงค์</span>
                <textarea
                  rows={2}
                  value={okr.objective}
                  onChange={(e) => update(okr.id, { objective: e.target.value })}
                  placeholder="เพื่อพัฒนาความรู้และทักษะ..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-brand focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-slate-600">ผลลัพธ์หลัก</span>
                <textarea
                  rows={2}
                  value={okr.keyResult}
                  onChange={(e) => update(okr.id, { keyResult: e.target.value })}
                  placeholder="เช่น ผู้เข้าร่วมมีทักษะระดับดีขึ้นไปไม่น้อยกว่าร้อยละ 80"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-brand focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-slate-600">ค่าเป้าหมาย</span>
                {/* ผลลัพธ์หลักหลายข้อในแถวเดียว → ค่าเป้าหมายหลายบรรทัด เช่น "1. ร้อยละ 80" / "2. อย่างน้อย 3 ผลิตภัณฑ์" */}
                <textarea
                  rows={2}
                  data-testid="okr-target"
                  value={okr.target}
                  onChange={(e) => update(okr.id, { target: e.target.value })}
                  placeholder="เช่น ร้อยละ 80"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-semibold focus:border-brand focus:outline-none"
                />
              </label>
            </div>
            {okrs.length > 1 && (
              <button
                type="button"
                onClick={() => remove(okr.id)}
                className="mt-6 p-1 text-slate-400 hover:text-rose-500"
                title={`ลบวัตถุประสงค์ข้อ ${index + 1}`}
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
