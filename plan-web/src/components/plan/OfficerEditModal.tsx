import React, { useState, useEffect } from "react"
import { PlanProject, MultiplierBudgetItem } from "../../types/plan"
import { planService } from "../../services/planService"
import { ApiError } from "../../lib/api"
import { formatMoney } from "../../lib/formatters"
import { Icon } from "../ui/Icons"
import { Button } from "../ui/Button"

interface OfficerEditModalProps {
  isOpen: boolean
  onClose: () => void
  project: PlanProject
  onSaved: () => void
}

export function OfficerEditModal({
  isOpen,
  onClose,
  project,
  onSaved,
}: OfficerEditModalProps) {
  const [title, setTitle] = useState(project.name || "")
  const [amount, setAmount] = useState<number>(project.amount || 0)
  const [objective, setObjective] = useState(project.objective || "")
  const [targetGroup, setTargetGroup] = useState(project.targetGroup || "")
  
  // Budget breakdown
  const [nationalAmount, setNationalAmount] = useState<number>(
    project.formData?.budgetSources?.national ?? project.budgetSources?.national ?? project.amount
  )
  const [revenueAmount, setRevenueAmount] = useState<number>(
    project.formData?.budgetSources?.revenue ?? project.budgetSources?.revenue ?? 0
  )
  const [offBudgetAmount, setOffBudgetAmount] = useState<number>(
    project.formData?.budgetSources?.offBudget ?? project.budgetSources?.offBudget ?? 0
  )

  // Officer notes
  const [officerNotes, setOfficerNotes] = useState<string>(
    project.formData?.officerReviewNotes || ""
  )
  const [isSaving, setIsSaving] = useState(false)

  // Multiplier items copy
  const [multiplierItems, setMultiplierItems] = useState<MultiplierBudgetItem[]>(
    project.formData?.multiplierItems || []
  )

  useEffect(() => {
    setTitle(project.name || "")
    setAmount(project.amount || 0)
    setObjective(project.objective || "")
    setTargetGroup(project.targetGroup || "")
    setNationalAmount(
      project.formData?.budgetSources?.national ?? project.budgetSources?.national ?? project.amount
    )
    setRevenueAmount(
      project.formData?.budgetSources?.revenue ?? project.budgetSources?.revenue ?? 0
    )
    setOffBudgetAmount(
      project.formData?.budgetSources?.offBudget ?? project.budgetSources?.offBudget ?? 0
    )
    setOfficerNotes(project.formData?.officerReviewNotes || "")
    setMultiplierItems(project.formData?.multiplierItems || [])
  }, [project])

  if (!isOpen) return null

  const sumSources = (Number(nationalAmount) || 0) + (Number(revenueAmount) || 0) + (Number(offBudgetAmount) || 0)
  const isBudgetBalanced = Math.abs(sumSources - Number(amount)) < 0.01

  const handleMultiplierAmountChange = (index: number, newTotal: number) => {
    const updated = [...multiplierItems]
    updated[index] = { ...updated[index], totalAmount: newTotal }
    setMultiplierItems(updated)
    const newSum = updated.reduce((s, i) => s + (i.totalAmount || 0), 0)
    setAmount(newSum)
    setNationalAmount(newSum)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updatedFormData: any = {
        ...(project.formData || {}),
        fiscalYear: project.formData?.fiscalYear || project.fiscalYear || 2570,
        title,
        backgroundSolution: objective,
        officerReviewNotes: officerNotes,
        officerReviewedAt: new Date().toISOString(),
        officerReviewedBy: "เจ้าหน้าที่แผนและงบประมาณ",
        budgetSources: {
          national: Number(nationalAmount) || 0,
          revenue: Number(revenueAmount) || 0,
          offBudget: Number(offBudgetAmount) || 0,
        },
        multiplierItems: multiplierItems.length > 0 ? multiplierItems : project.formData?.multiplierItems,
      }

      const updates: Partial<PlanProject> = {
        name: title,
        amount: Number(amount) || 0,
        objective: objective,
        targetGroup: targetGroup,
        formData: updatedFormData,
        budgetSources: {
          national: Number(nationalAmount) || 0,
          revenue: Number(revenueAmount) || 0,
          offBudget: Number(offBudgetAmount) || 0,
        },
      }

      await planService.updateProjectData(project.id, project.dbId, updates)

      alert("บันทึกการปรับปรุงข้อมูลโครงการเรียบร้อยแล้ว!")
      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      alert(err instanceof ApiError ? err.detail : "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-line max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
              <Icon name="edit" size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">
                แก้ไขข้อมูลโครงการแทนอาจารย์
              </h2>
              <p className="text-xs text-muted">
                รหัสโครงการ: <span className="font-mono font-bold text-brand">{project.id}</span> · ผู้เสนอ: {project.owner} ({project.unit})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-gray-200 transition-colors"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-ink">
          {/* Notice Alert */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-3">
            <Icon name="alert" size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[12px] text-amber-800 leading-relaxed">
              <span className="font-bold">สิทธิ์การปฏิบัติงานของเจ้าหน้าที่แผน:</span> ท่านสามารถปรับปรุงยอดเงิน แหล่งงบประมาณ หรือแก้ไขข้อความตามระเบียบพัสดุ/การเงินแทนอาจารย์ได้โดยตรง ระบบบันทึกประวัติการแก้ไขให้อัตโนมัติ
            </div>
          </div>

          {/* Section 1: Title & Core */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-brand border-b border-gray-100 pb-1">
              1. ข้อมูลทั่วไปโครงการ
            </h3>
            <div>
              <label className="block font-semibold mb-1">ชื่อโครงการ</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-line-strong px-3 py-2 text-xs focus:border-brand focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">กลุ่มเป้าหมาย</label>
                <input
                  type="text"
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full rounded-lg border border-line-strong px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">วัตถุประสงค์หลัก</label>
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full rounded-lg border border-line-strong px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Budget Allocation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
              <h3 className="font-bold text-sm text-brand">
                2. วงเงินงบประมาณและการกระจายแหล่งเงิน
              </h3>
              <div className="font-mono font-bold text-sm text-brand">
                รวม: ฿{formatMoney(amount)}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 bg-surface p-3.5 rounded-xl border border-line">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">วงเงินรวมทั้งสิ้น (บาท)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-line-strong px-3 py-2 font-mono font-bold text-xs bg-white focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-emerald-800">งบแผ่นดิน (บาท)</label>
                <input
                  type="number"
                  value={nationalAmount}
                  onChange={(e) => setNationalAmount(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-line-strong px-3 py-2 font-mono text-xs bg-white focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-blue-800">งบเงินรายได้ (บาท)</label>
                <input
                  type="number"
                  value={revenueAmount}
                  onChange={(e) => setRevenueAmount(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-line-strong px-3 py-2 font-mono text-xs bg-white focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-purple-800">งบอื่นๆ (บาท)</label>
                <input
                  type="number"
                  value={offBudgetAmount}
                  onChange={(e) => setOffBudgetAmount(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-line-strong px-3 py-2 font-mono text-xs bg-white focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            {!isBudgetBalanced && (
              <div className="text-[11px] text-red-600 font-semibold flex items-center gap-1.5">
                <Icon name="alert" size={14} />
                ยอดรวมแหล่งเงิน (฿{formatMoney(sumSources)}) ไม่ตรงกับวงเงินรวมทั้งสิ้น (฿{formatMoney(amount)})
              </div>
            )}
          </div>

          {/* Section 3: Multiplier Items Quick Tweak if available */}
          {multiplierItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-brand border-b border-gray-100 pb-1">
                3. แก้ไขรายการค่าใช้จ่าย (ตัวคูณ)
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {multiplierItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-line bg-white text-xs hover:border-brand/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-ink">{item.name}</div>
                      <div className="text-[11px] text-muted">
                        {item.targetQty} {item.targetUnit} x {item.durationQty} {item.durationUnit} x ฿{formatMoney(item.unitRate)} x {item.frequencyQty} {item.frequencyUnit}
                      </div>
                    </div>
                    <div className="w-36 flex items-center gap-1">
                      <span className="text-muted">฿</span>
                      <input
                        type="number"
                        value={item.totalAmount}
                        onChange={(e) => handleMultiplierAmountChange(idx, Number(e.target.value) || 0)}
                        className="w-full rounded-md border border-line-strong px-2 py-1 text-right font-mono font-bold text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Officer Review Notes */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-brand border-b border-gray-100 pb-1">
              4. บันทึกความเห็นและการปรับปรุงของเจ้าหน้าที่แผน
            </h3>
            <textarea
              rows={3}
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="ระบุข้อความชี้แจงการแก้ไข หรือข้อเสนอแนะในการปรับปรุง เช่น ปรับลดยอดค่าอาหารว่างให้ตรงตามระเบียบ 35 บ./คน/มื้อ..."
              className="w-full rounded-lg border border-line-strong p-3 text-xs focus:border-brand focus:outline-none"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-line px-6 py-4 bg-surface">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            ยกเลิก
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="accent"
              size="md"
              icon="check"
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
            >
              {isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
