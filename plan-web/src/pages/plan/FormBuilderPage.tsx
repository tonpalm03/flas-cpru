import { useState, useEffect } from "react"
import {
  PlanPage,
  FormTemplate,
  FormFieldSchema,
  FormFieldType,
  BudgetType,
  BudgetCategory,
} from "../../types/plan"
import { templateService } from "../../services/templateService"
import { Card } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { PageHeader } from "../../components/ui/PageHeader"
import { Icon } from "../../components/ui/Icons"
import { WordAutoMapper } from "../../components/plan/WordAutoMapper"


interface FormBuilderPageProps {
  onNavigate: (page: PlanPage) => void
}

export function FormBuilderPage({ onNavigate }: FormBuilderPageProps) {
  const [activeTab, setActiveTab] = useState<"builder" | "budget_types" | "word">(
    "builder"
  )
  const [isLoading, setIsLoading] = useState(false)

  // 1. Template State
  const [template, setTemplate] = useState<FormTemplate>({
    id: "tpl-2570",
    fiscalYear: 2570,
    title: "แบบฟอร์มเสนอโครงการฉบับทางการ มรภ.ชัยภูมิ (พ.ศ. 2570)",
    description: "แบบฟอร์มประจำปีงบประมาณ 2570",
    isActive: true,
    schema: [],
  })

  // 2. Hierarchical Budget Tree State
  const [budgetTree, setBudgetTree] = useState<BudgetCategory[]>([])
  const [selectedParentCategory, setSelectedParentCategory] = useState<BudgetCategory | null>(null)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDesc, setNewCategoryDesc] = useState("")

  // 3. New Question Modal / State
  const [editingField, setEditingField] = useState<FormFieldSchema | null>(null)

  // Load Data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const tpl = await templateService.getActiveTemplate(2569)
      setTemplate(tpl)
      const tree = await templateService.getCategoryTree(2569)
      setBudgetTree(tree)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleCategory = async (id: string, currentActive: boolean) => {
    await templateService.toggleCategoryActive(id, !currentActive)
    const tree = await templateService.getCategoryTree(2569)
    setBudgetTree(tree)
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm("ยืนยันการลบหมวดหมู่งบประมาณนี้และหมวดหมู่ย่อยทั้งหมดข้างใน?")) {
      await templateService.deleteCategory(id)
      const tree = await templateService.getCategoryTree(2569)
      setBudgetTree(tree)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("กรุณาระบุชื่อหมวดหมู่งบประมาณ")
      return
    }
    await templateService.addCategory({
      name: newCategoryName.trim(),
      description: newCategoryDesc.trim(),
      parentId: selectedParentCategory ? selectedParentCategory.id : null,
      fiscalYear: 2569,
    })
    setShowAddCategoryModal(false)
    setNewCategoryName("")
    setNewCategoryDesc("")
    setSelectedParentCategory(null)
    const tree = await templateService.getCategoryTree(2569)
    setBudgetTree(tree)
  }

  // Handle Add New Question
  const handleAddNewQuestion = () => {
    const newField: FormFieldSchema = {
      id: `f_${Date.now()}`,
      name: `custom_field_${Date.now().toString().slice(-4)}`,
      label: "คำถามใหม่",
      type: "textarea",
      required: true,
      wordTag: `custom_tag_${Date.now().toString().slice(-4)}`,
      placeholder: "กรอกรายละเอียด...",
      helpText: "",
    }
    setTemplate({
      ...template,
      schema: [...template.schema, newField],
    })
  }

  // Handle Delete Question
  const handleDeleteField = (id: string) => {
    setTemplate({
      ...template,
      schema: template.schema.filter((f) => f.id !== id),
    })
  }

  // Handle Update Question Field
  const handleUpdateField = (
    id: string,
    key: keyof FormFieldSchema,
    val: any
  ) => {
    setTemplate({
      ...template,
      schema: template.schema.map((f) =>
        f.id === id ? { ...f, [key]: val } : f
      ),
    })
  }

  // Handle Save Template
  const handleSaveTemplate = async () => {
    setIsLoading(true)
    try {
      await templateService.saveTemplate(template)
      alert(
        `บันทึกโครงสร้างแบบฟอร์มปี ${template.fiscalYear} เรียบร้อยแล้ว!\nเมื่ออาจารย์เปิดหน้าเสนอโครงการ จะเห็นคำถามที่ท่านออกแบบทันที`
      )
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* Page Header */}
      <PageHeader
        eyebrow="Enterprise Administration · FastCPRU"
        title="เครื่องมือออกแบบฟอร์ม & จัดการงบประมาณ (No-Code Builder)"
        description="สำหรับเจ้าหน้าที่แผน: ออกแบบคำถามประจำปี ผูกตัวแปร Word Tag {{...}} และเปิด/ปิดประเภทงบประมาณ โดยไม่ต้องแก้โค้ด"
        onBack={() => onNavigate("dashboard")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon="eye"
              onClick={() => onNavigate("proposal")}
            >
              ทดลองดูมุมมองอาจารย์
            </Button>
            <Button
              variant="accent"
              size="md"
              icon="check"
              onClick={handleSaveTemplate}
              disabled={isLoading}
            >
              {isLoading ? "กำลังบันทึก..." : "บันทึกเทมเพลตประจำปี"}
            </Button>
          </div>
        }
      />

      {/* Main Tabs */}
      <div className="flex border-b border-line gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("builder")}
          className={`py-3 px-5 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "builder"
              ? "border-brand text-brand"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          <Icon name="edit" size={15} />
          <span>1. ออกแบบคำถามในฟอร์ม (No-Code Builder)</span>
          <span className="rounded-full bg-brand-soft px-2 py-0.2 text-[10px]">
            {template.schema.length} ข้อ
          </span>
        </button>

        <button
          onClick={() => setActiveTab("budget_types")}
          className={`py-3 px-5 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "budget_types"
              ? "border-brand text-brand"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          <Icon name="wallet" size={15} />
          <span>2. ผังหมวดหมู่งบประมาณ 3 ระดับ (Tree View)</span>
          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.2 text-[10px]">
            {budgetTree.length} งบหลัก
          </span>
        </button>

        <button
          onClick={() => setActiveTab("word")}
          className={`py-3 px-5 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "word"
              ? "border-brand text-brand"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          <Icon name="receipt" size={15} />
          <span>3. แม่แบบเอกสาร Word (docxtemplater)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: NO-CODE FORM BUILDER                                              */}
      {/* ========================================================================= */}
      {activeTab === "builder" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Form Settings & Questions List */}
          <div className="lg:col-span-7 space-y-4">
            {/* Fiscal Year & Title Header */}
            <Card className="p-5 space-y-3 bg-surface border border-line">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand">
                  ตั้งค่าแบบฟอร์มประจำปี
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">ปีงบประมาณ:</span>
                  <input
                    type="number"
                    value={template.fiscalYear}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        fiscalYear: Number(e.target.value),
                      })
                    }
                    className="w-20 rounded-lg border border-line-strong bg-white px-2 py-1 text-xs font-bold text-brand text-center"
                  />
                </div>
              </div>

              <input
                type="text"
                value={template.title}
                onChange={(e) =>
                  setTemplate({ ...template, title: e.target.value })
                }
                placeholder="ชื่อแบบฟอร์ม เช่น แบบฟอร์มเสนอโครงการประจำปี พ.ศ. 2570"
                className="w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-xs font-semibold"
              />
            </Card>

            {/* Questions List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-ink">
                  รายการคำถามในแบบฟอร์ม ({template.schema.length} ข้อ)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  icon="plus"
                  onClick={handleAddNewQuestion}
                >
                  เพิ่มคำถามใหม่
                </Button>
              </div>

              {template.schema.map((field, idx) => (
                <Card
                  key={field.id}
                  className="p-4 space-y-3 border border-line bg-white hover:border-brand/30 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-brand bg-brand-soft px-2 py-0.5 rounded">
                      ข้อที่ {idx + 1}
                    </span>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            handleUpdateField(field.id, "required", e.target.checked)
                          }
                          className="rounded accent-brand"
                        />
                        <span>จำเป็นต้องตอบ</span>
                      </label>

                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="ลบคำถามนี้"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Question Label */}
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">
                      หัวข้อคำถาม (Label) :
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) =>
                        handleUpdateField(field.id, "label", e.target.value)
                      }
                      className="w-full rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold"
                    />
                  </div>

                  {/* Type & Word Tag */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] text-muted block mb-1">
                        ชนิดของช่องกรอก :
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) =>
                          handleUpdateField(
                            field.id,
                            "type",
                            e.target.value as FormFieldType
                          )
                        }
                        className="w-full rounded-lg border border-line-strong bg-white px-2.5 py-1.5 text-xs"
                      >
                        <option value="text">ข้อความสั้น (Single line)</option>
                        <option value="textarea">ข้อความยาว (Paragraph)</option>
                        <option value="select">ตัวเลือก Dropdown</option>
                        <option value="number">ตัวเลข (Number)</option>
                        <option value="date">วันที่ (Date)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-brand font-bold block mb-1">
                        Word Tag อ้างอิง :
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={field.wordTag}
                          onChange={(e) =>
                            handleUpdateField(
                              field.id,
                              "wordTag",
                              e.target.value.replace(/[{}]/g, "")
                            )
                          }
                          className="w-full rounded-lg border border-line-strong bg-slate-50 font-mono px-2.5 py-1.5 text-xs text-brand"
                        />
                        <span className="text-[10px] text-slate-400 absolute right-2 top-2 font-mono">
                          {`{{${field.wordTag}}}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Options for Select */}
                  {field.type === "select" && (
                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] text-muted block">
                        ตัวเลือกใน Dropdown (คั่นด้วยเครื่องหมายจุลภาค ,) :
                      </label>
                      <input
                        type="text"
                        value={field.options?.join(", ") || ""}
                        onChange={(e) =>
                          handleUpdateField(
                            field.id,
                            "options",
                            e.target.value.split(",").map((s) => s.trim())
                          )
                        }
                        placeholder="ตัวเลือก 1, ตัวเลือก 2, ตัวเลือก 3"
                        className="w-full rounded-lg border border-line-strong px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  )}
                </Card>
              ))}

              <Button
                variant="outline"
                size="md"
                icon="plus"
                className="w-full py-3 border-dashed border-brand/30 text-brand hover:bg-brand/5"
                onClick={handleAddNewQuestion}
              >
                + เพิ่มคำถามใหม่ในแบบฟอร์ม
              </Button>
            </div>
          </div>

          {/* Right Column: Live Teacher View Simulator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-6">
              <Card className="p-6 space-y-4 bg-gradient-to-b from-white to-surface border border-line-strong shadow-md">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-brand text-white text-[10px] font-bold">
                      👁️
                    </span>
                    <span className="text-xs font-bold text-ink">
                      ตัวอย่างหน้าจอจริงที่อาจารย์จะเห็น (Live Preview)
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    Dynamic
                  </span>
                </div>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 text-xs">
                  {/* Simulated Core Fields */}
                  <div className="p-3 rounded-xl bg-slate-100/70 space-y-2 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Core System Fields (คงที่เสมอ)
                    </span>
                    <div>
                      <span className="font-bold text-ink">ชื่อโครงการ *</span>
                      <input
                        disabled
                        placeholder="พิมพ์ชื่อโครงการ..."
                        className="mt-1 w-full rounded border bg-white p-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-ink">ประเภทงบประมาณ *</span>
                      <select
                        disabled
                        className="mt-1 w-full rounded border bg-white p-1.5 text-xs"
                      >
                        {budgetTree
                          .filter((b) => b.isActive)
                          .map((b) => (
                            <option key={b.id}>{b.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Dynamically Rendered Questions */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-bold text-brand uppercase">
                      Dynamic Questions (ตามที่คุณออกแบบไว้ทางซ้าย)
                    </span>

                    {template.schema.map((f, i) => (
                      <div key={f.id} className="space-y-1">
                        <label className="font-semibold text-ink block">
                          {i + 1}. {f.label}{" "}
                          {f.required && (
                            <span className="text-rose-500">*</span>
                          )}
                        </label>
                        {f.type === "textarea" ? (
                          <textarea
                            disabled
                            placeholder={f.placeholder || "กรอกข้อความ..."}
                            rows={2}
                            className="w-full rounded border bg-white p-2 text-xs"
                          />
                        ) : f.type === "select" ? (
                          <select
                            disabled
                            className="w-full rounded border bg-white p-1.5 text-xs"
                          >
                            {f.options?.map((opt, oIdx) => (
                              <option key={oIdx}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={f.type}
                            disabled
                            placeholder={f.placeholder || ""}
                            className="w-full rounded border bg-white p-1.5 text-xs"
                          />
                        )}
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Tag: {`{{${f.wordTag}}}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BUDGET TYPES MASTER DATA                                           */}
      {/* ========================================================================= */}
      {activeTab === "budget_types" && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ink">
                  จัดการผังหมวดหมู่งบประมาณ 3 ระดับ (Hierarchical Tree View)
                </h2>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  Self-Referencing
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                โครงสร้างงบประมาณ: <strong>งบหลัก ➔ งบย่อย Level 1 ➔ หมวดรายจ่าย Level 2</strong> เจ้าหน้าที่แผนสามารถเพิ่มงบย่อย หรือสลับเปิด/ปิดได้ทันทีโดยไม่ต้องแก้ไขโค้ด
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon="plus"
              onClick={() => {
                setSelectedParentCategory(null)
                setShowAddCategoryModal(true)
              }}
            >
              ➕ เพิ่มงบหลัก (Root Budget)
            </Button>
          </div>

          {/* Tree View / Nested List Display */}
          <div className="space-y-4">
            {budgetTree.map((root) => (
              <div
                key={root.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs"
              >
                {/* Level 0: Root Budget Header */}
                <div className="bg-brand/5 border-b border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-xl bg-brand text-accent font-black text-xs shrink-0">
                      L0
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-brand">
                          {root.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          code: {root.code}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            root.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {root.isActive ? "● ใช้งานอยู่" : "○ ปิดใช้งาน"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {root.description || "งบประมาณหลักประจำปี"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleCategory(root.id, root.isActive)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        root.isActive
                          ? "border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                          : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                      }`}
                    >
                      {root.isActive ? "ปิดงบนี้" : "เปิดงบนี้"}
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedParentCategory(root)
                        setShowAddCategoryModal(true)
                      }}
                      className="text-xs border-brand text-brand hover:bg-brand/5"
                    >
                      ➕ เพิ่มงบย่อย (Level 1)
                    </Button>
                  </div>
                </div>

                {/* Level 1: Sub-budgets */}
                <div className="p-4 space-y-3 bg-slate-50/40">
                  {(!root.children || root.children.length === 0) ? (
                    <div className="text-xs text-slate-400 italic pl-4 py-1">
                      ยังไม่มีงบย่อยภายใต้งบนี้ คลิกปุ่ม "เพิ่มงบย่อย" เพื่อเริ่มสร้าง
                    </div>
                  ) : (
                    root.children.map((sub) => (
                      <div
                        key={sub.id}
                        className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 ml-4 shadow-2xs"
                      >
                        {/* Level 1 Item Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-mono text-sm">└─</span>
                            <span className="rounded bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 text-[10px] font-bold">
                              Level 1
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {sub.name}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                sub.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {sub.isActive ? "เปิด" : "ปิด"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleCategory(sub.id, sub.isActive)}
                              className="text-[11px] text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded border border-slate-200 bg-slate-50 cursor-pointer"
                            >
                              {sub.isActive ? "สลับปิด" : "สลับเปิด"}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedParentCategory(sub)
                                setShowAddCategoryModal(true)
                              }}
                              className="text-[11px] font-semibold text-brand hover:bg-brand/10 px-2 py-0.5 rounded border border-brand/30 cursor-pointer"
                            >
                              ➕ เพิ่มหมวดรายจ่าย (Level 2)
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(sub.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="ลบงบย่อย"
                            >
                              <Icon name="close" size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Level 2: Expense Categories (Pills) */}
                        {sub.children && sub.children.length > 0 && (
                          <div className="pl-6 pt-1 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-mono">└──</span>
                            <span className="text-[11px] text-slate-500 font-semibold">
                              หมวดรายจ่าย:
                            </span>
                            {sub.children.map((exp) => (
                              <div
                                key={exp.id}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs border ${
                                  exp.isActive
                                    ? "bg-slate-50 border-slate-300 text-slate-800"
                                    : "bg-slate-100 border-slate-200 text-slate-400 line-through"
                                }`}
                              >
                                <span>{exp.name}</span>
                                <button
                                  onClick={() => handleToggleCategory(exp.id, exp.isActive)}
                                  className="text-[10px] text-slate-400 hover:text-slate-700 cursor-pointer"
                                  title={exp.isActive ? "คลิกเพื่อปิด" : "คลิกเพื่อเปิด"}
                                >
                                  {exp.isActive ? "●" : "○"}
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(exp.id)}
                                  className="text-slate-300 hover:text-rose-600 cursor-pointer"
                                  title="ลบ"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal to Add New Category (Root or Sub-category) */}
          {showAddCategoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-base font-bold text-ink">
                    {selectedParentCategory
                      ? `เพิ่มงบย่อยภายใต้ "${selectedParentCategory.name}"`
                      : "เพิ่มงบประมาณหลักใหม่ (Root Budget)"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedParentCategory
                      ? `ระดับ: ${selectedParentCategory.parentId ? "Level 2 (หมวดรายจ่าย)" : "Level 1 (งบย่อย)"}`
                      : "ระดับ: Level 0 (งบประมาณหลัก)"}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">
                      ชื่อหมวดหมู่งบประมาณ :
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="เช่น งบดำเนินงาน, ค่าตอบแทน, งบโครงการพิเศษ..."
                      className="w-full rounded-lg border border-line-strong p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">คำอธิบาย :</label>
                    <input
                      type="text"
                      value={newCategoryDesc}
                      onChange={(e) => setNewCategoryDesc(e.target.value)}
                      placeholder="คำอธิบายรายละเอียด..."
                      className="w-full rounded-lg border border-line-strong p-2 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddCategoryModal(false)
                      setSelectedParentCategory(null)
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateCategory}
                  >
                    บันทึกข้อมูล
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WORD TEMPLATE ENGINE (AI Auto-Mapper + docxtemplater)              */}
      {/* ========================================================================= */}
      {activeTab === "word" && (
        <div className="space-y-6">
          {/* AI Auto-Mapper Interactive Component */}
          <WordAutoMapper
            fiscalYear={template.fiscalYear}
            availableTags={[
              { tag: "project_name", label: "ชื่อโครงการ (Core Data)" },
              { tag: "total_budget", label: "วงเงินงบประมาณรวม (Core Data)" },
              { tag: "budget_type_name", label: "ชื่อประเภทงบประมาณ" },
              ...template.schema.map((f) => ({
                tag: f.wordTag,
                label: f.label,
              })),
            ]}
            onTemplateUpdated={(url) => {
              setTemplate((prev) => ({ ...prev, wordTemplateUrl: url }))
            }}
          />

          <Card className="p-6 space-y-6">
            <div className="border-b border-line pb-4">
              <h2 className="text-base font-bold text-ink">
                คำแนะนำโครงสร้างแท็กเอกสาร Word (.docx)
              </h2>
              <p className="text-xs text-muted">
                ระบบจะหยอดข้อมูลลงในเอกสารให้อัตโนมัติ โดยไม่สูญเสียฟอนต์และระยะขอบกระดาษราชการ
              </p>
            </div>

          {/* How It Works Guide */}
          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-1.5">
              <span className="font-black text-brand text-sm">ขั้นตอนที่ 1</span>
              <p className="font-bold text-ink">ใส่ Tag ในไฟล์ Word</p>
              <p className="text-slate-600">
                เปิดไฟล์ Word ของ มรภ.ชัยภูมิ ใส่ป้ายแท็กเช่น{" "}
                <code className="text-brand font-bold">
                  {"{{project_name}}"}
                </code>{" "}
                ลงในจุดที่ต้องการ
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-1.5">
              <span className="font-black text-brand text-sm">ขั้นตอนที่ 2</span>
              <p className="font-bold text-ink">อัปโหลดเข้าสู่ระบบ</p>
              <p className="text-slate-600">
                อัปโหลดไฟล์ Word เข้ามาในระบบ (ปีละ 1 ครั้งตอนขึ้นปีงบประมาณใหม่)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-1.5">
              <span className="font-black text-brand text-sm">ขั้นตอนที่ 3</span>
              <p className="font-bold text-ink">ออกเอกสารอัตโนมัติ</p>
              <p className="text-slate-600">
                อาจารย์กด Submit ปุ๊บ docxtemplater จะสร้างไฟล์ Word/PDF ที่กรอกข้อมูลเสร็จพร้อมปริ้นท์เซ็นทันที!
              </p>
            </div>
          </div>

          {/* Current Available Tags List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-ink">
              รายการแท็กที่ใช้งานได้ในไฟล์ Word ประจำปี {template.fiscalYear} :
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                <strong>{"{{project_name}}"}</strong>
                <span className="block text-[11px] font-sans text-emerald-700 mt-0.5">
                  ชื่อโครงการ (Core Data)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                <strong>{"{{total_budget}}"}</strong>
                <span className="block text-[11px] font-sans text-emerald-700 mt-0.5">
                  วงเงินงบประมาณรวม (Core Data)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                <strong>{"{{budget_type_name}}"}</strong>
                <span className="block text-[11px] font-sans text-emerald-700 mt-0.5">
                  ชื่อประเภทงบประมาณ
                </span>
              </div>
              {template.schema.map((f) => (
                <div
                  key={f.id}
                  className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-brand"
                >
                  <strong>{`{{${f.wordTag}}}`}</strong>
                  <span className="block text-[11px] font-sans text-slate-600 mt-0.5">
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )}
  </div>
  )
}
