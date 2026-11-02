import { useEffect, useState } from "react"
import { PlanProject, PlanPage } from "../../types/plan"
import { ApiError } from "../../lib/api"
import { ProjectLedgerData, baht, budgetService } from "../../services/budgetService"
import { Card } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Field } from "../../components/ui/Field"
import { PageHeader } from "../../components/ui/PageHeader"

interface ClosurePageProps {
  project: PlanProject
  onNavigate: (page: PlanPage) => void
  onClosed: () => void
}

const inputClass = "w-full rounded-xl border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"

/** ปิดโครงการ: ยอดเบิกจริงมาจากทะเบียนการเบิกจ่าย ส่วนที่เหลือคืนวงเงินสาขาอัตโนมัติ */
export function ClosurePage({ project, onNavigate, onClosed }: ClosurePageProps) {
  const [ledger, setLedger] = useState<ProjectLedgerData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // ผลการดำเนินงาน (ไม่บังคับ) — เก็บไว้กับประวัติการปิดโครงการ
  const [participantCount, setParticipantCount] = useState("")
  const [satisfactionScore, setSatisfactionScore] = useState("")
  const [outcomeReport, setOutcomeReport] = useState("")
  const [photoAlbumUrl, setPhotoAlbumUrl] = useState("")

  useEffect(() => {
    budgetService
      .getProjectLedger(project.id)
      .then(setLedger)
      .catch((e) => setError(e instanceof ApiError ? e.detail : "โหลดงบของโครงการไม่สำเร็จ"))
  }, [project.id])

  const bySource = Object.values(
    (ledger?.lines ?? []).reduce<Record<string, { label: string; amount: number; spent: number }>>((acc, line) => {
      const entry = (acc[line.source_code] ??= { label: line.source_label, amount: 0, spent: 0 })
      entry.amount += line.amount
      entry.spent += line.spent
      return acc
    }, {})
  )
  const canClose = ledger?.status === "COMPLETED_WITH_SCAN"

  const close = async () => {
    if (!ledger) return
    if (!confirm(`ปิดโครงการ ${project.id}?\nเบิกจ่ายจริง ${baht(ledger.totals.spent)} บาท · คืนวงเงินสาขา ${baht(ledger.totals.remaining)} บาท\nปิดแล้วบันทึกการเบิกจ่ายเพิ่มไม่ได้`)) return
    setSubmitting(true)
    setError(null)
    try {
      await budgetService.closeProject(project.id, {
        participantCount: participantCount ? Number(participantCount) : undefined,
        satisfactionScore: satisfactionScore ? Number(satisfactionScore) : undefined,
        outcomeReport: outcomeReport.trim() || undefined,
        photoAlbumUrl: photoAlbumUrl.trim() || undefined,
      })
      onClosed()
      onNavigate("projects")
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "ปิดโครงการไม่สำเร็จ")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="ปิดโครงการ"
        title="สรุปการเบิกจ่ายและคืนงบคงเหลือ"
        description={`${project.id} · ${project.name}`}
        onBack={() => onNavigate("project-detail")}
      />

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">{error}</div>}

      <Card data-testid="closure-summary" className="overflow-hidden border-0 bg-brand-strong p-6 text-white sm:p-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-accent">สรุปการเงินโครงการ ณ วันปิดโครงการ</div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <div className="text-[11px] text-white/60">งบที่ได้รับอนุมัติ</div>
            <div className="mt-1 font-mono text-xl font-bold">฿{baht(ledger?.totals.amount ?? 0)}</div>
          </div>
          <div>
            <div className="text-[11px] text-white/60">เบิกจ่ายจริง (จากทะเบียนการเบิกจ่าย)</div>
            <div data-testid="closure-spent" className="mt-1 font-mono text-xl font-bold text-accent">
              ฿{baht(ledger?.totals.spent ?? 0)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-white/60">คืนวงเงินสาขา</div>
            <div data-testid="closure-returned" className="mt-1 font-mono text-xl font-bold text-accent">
              ฿{baht(ledger?.totals.remaining ?? 0)}
            </div>
          </div>
        </div>
      </Card>

      {bySource.length > 1 && (
        <Card className="p-5">
          <table className="w-full text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th className="py-2">แหล่งงบ</th>
                <th className="py-2 text-right">งบ</th>
                <th className="py-2 text-right">เบิกจริง</th>
                <th className="py-2 text-right">คืน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {bySource.map((s) => (
                <tr key={s.label}>
                  <td className="py-2 font-semibold">{s.label}</td>
                  <td className="py-2 text-right font-mono">{baht(s.amount)}</td>
                  <td className="py-2 text-right font-mono">{baht(s.spent)}</td>
                  <td className="py-2 text-right font-mono">{baht(s.amount - s.spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card className="p-6 sm:p-8 space-y-5">
        {ledger && ledger.totals.spent === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            ยังไม่มีรายการเบิกจ่ายของโครงการนี้ — ถ้าปิดโครงการ งบทั้งหมดจะคืนวงเงินสาขา
          </div>
        )}
        {ledger && !canClose && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            ปิดโครงการได้หลังอัปโหลดเอกสารที่ลงนามครบแล้ว และยังไม่ได้ปิดโครงการ
          </div>
        )}

        <div>
          <h2 className="text-base font-bold text-ink">ผลการดำเนินงาน (ไม่บังคับ)</h2>
          <p className="text-xs text-muted">บันทึกไว้กับประวัติการปิดโครงการ</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="จำนวนผู้เข้าร่วมจริง (คน)">
            <input type="number" min={0} value={participantCount} onChange={(e) => setParticipantCount(e.target.value)} className={inputClass} />
          </Field>
          <Field label="ผลประเมินความพึงพอใจ (%)">
            <input type="number" min={0} max={100} value={satisfactionScore} onChange={(e) => setSatisfactionScore(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="ผลลัพธ์สำคัญของโครงการ">
          <textarea rows={3} value={outcomeReport} onChange={(e) => setOutcomeReport(e.target.value)} className={inputClass} />
        </Field>
        <Field label="ลิงก์อัลบั้มภาพ / เอกสารประกอบ">
          <input type="url" value={photoAlbumUrl} onChange={(e) => setPhotoAlbumUrl(e.target.value)} placeholder="https://..." className={inputClass} />
        </Field>

        <div className="flex justify-end border-t border-line pt-4">
          <Button data-testid="confirm-close" variant="accent" size="lg" onClick={close} disabled={!canClose || submitting}>
            {submitting ? "กำลังปิดโครงการ..." : "ยืนยันปิดโครงการ"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
