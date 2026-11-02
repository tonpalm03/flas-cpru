import { supabase } from "../lib/supabase"
import { authHeaders } from "../lib/currentUser"
import {
  BudgetType,
  BudgetCategory,
  FormTemplate,
  FormFieldSchema,
} from "../types/plan"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"

// Default Master Budget Types (Legacy compatibility)
export const defaultBudgetTypes: BudgetType[] = [
  {
    id: "bt-national",
    code: "national",
    name: "งบประมาณแผ่นดิน",
    description: "งบประมาณจัดสรรประจำปีจากรัฐบาล",
    fiscalYear: 2569,
    isActive: true,
  },
  {
    id: "bt-revenue",
    code: "revenue",
    name: "งบประมาณเงินรายได้",
    description: "เงินรายได้คณะและมหาวิทยาลัย",
    fiscalYear: 2569,
    isActive: true,
  },
  {
    id: "bt-offbudget",
    code: "off_budget",
    name: "งบประมาณอื่น ๆ / นอกแผน",
    description: "งบประมาณสนับสนุนจากภายนอกหรือเงินบริจาค",
    fiscalYear: 2569,
    isActive: true,
  },
]

// Default Hierarchical Budget Categories (3 Levels, Self-Referencing Adjacency List)
export const defaultBudgetCategories: BudgetCategory[] = [
  // 1. Level 0 (งบหลัก - parentId === null)
  {
    id: "bc-national",
    code: "national",
    name: "งบประมาณแผ่นดิน",
    description: "งบประมาณจัดสรรประจำปีจากรัฐบาล",
    parentId: null,
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "bc-revenue",
    code: "revenue",
    name: "งบประมาณเงินรายได้",
    description: "เงินรายได้คณะและมหาวิทยาลัย",
    parentId: null,
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "bc-offbudget",
    code: "off_budget",
    name: "งบประมาณอื่น ๆ / นอกแผน",
    description: "งบประมาณสนับสนุนจากแหล่งทุนภายนอกหรือเงินบริจาค",
    parentId: null,
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 3,
  },

  // 2. Level 1 (งบย่อยภายใต้งบแผ่นดิน)
  {
    id: "bc-nat-ops",
    code: "nat_operations",
    name: "งบดำเนินงาน",
    description: "ค่าใช้จ่ายในการดำเนินงานและการจัดโครงการ",
    parentId: "bc-national",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "bc-nat-invest",
    code: "nat_investment",
    name: "งบลงทุน",
    description: "ค่าครุภัณฑ์ ที่ดิน และสิ่งก่อสร้าง",
    parentId: "bc-national",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "bc-nat-personnel",
    code: "nat_personnel",
    name: "งบบุคลากร",
    description: "เงินเดือน ค่าจ้างประจำ และค่าจ้างชั่วคราว",
    parentId: "bc-national",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 3,
  },

  // 2. Level 1 (งบย่อยภายใต้งบเงินรายได้)
  {
    id: "bc-rev-ops",
    code: "rev_operations",
    name: "งบดำเนินงาน (เงินรายได้)",
    description: "ค่าใช้จ่ายดำเนินงานจากเงินรายได้คณะ/มหาวิทยาลัย",
    parentId: "bc-revenue",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "bc-rev-academic",
    code: "rev_academic",
    name: "งบพัฒนาวิชาการและวิจัย",
    description: "ทุนสนับสนุนการวิจัยและการพัฒนานวัตกรรมการเรียนรู้",
    parentId: "bc-revenue",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "bc-rev-student",
    code: "rev_student",
    name: "งบกิจกรรมพัฒนานักศึกษา",
    description: "ค่าใช้จ่ายเสริมสร้างทักษะและกิจกรรมนักศึกษา",
    parentId: "bc-revenue",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 3,
  },

  // 2. Level 1 (งบย่อยภายใต้งบนอกแผน)
  {
    id: "bc-off-external",
    code: "off_external",
    name: "ทุนวิจัย/บริการวิชาการภายนอก",
    description: "งบสนับสนุนจาก บพข., วช. หรือภาคีเครือข่าย",
    parentId: "bc-offbudget",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "bc-off-donation",
    code: "off_donation",
    name: "เงินบริจาค/กองทุนพัฒนา",
    description: "เงินบริจาคเพื่อการศึกษาและกองทุนพิเศษ",
    parentId: "bc-offbudget",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 2,
  },

  // 3. Level 2 (หมวดรายจ่ายภายใต้งบดำเนินงาน แผ่นดิน)
  {
    id: "bc-nat-ops-comp",
    code: "nat_ops_comp",
    name: "ค่าตอบแทน",
    description: "ค่าตอบแทนวิทยากร ผู้ทรงคุณวุฒิ และคณะทำงาน",
    parentId: "bc-nat-ops",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "bc-nat-ops-oper",
    code: "nat_ops_oper",
    name: "ค่าใช้สอย",
    description: "ค่าอาหารกลางวัน อาหารว่าง ยานพาหนะ และสถานที่",
    parentId: "bc-nat-ops",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "bc-nat-ops-mat",
    code: "nat_ops_mat",
    name: "ค่าวัสดุ",
    description: "ค่าวัสดุฝึกอบรม วัสดุสำนักงาน และเอกสารประกอบ",
    parentId: "bc-nat-ops",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 3,
  },

  // 3. Level 2 (หมวดรายจ่ายภายใต้งบดำเนินงาน เงินรายได้)
  {
    id: "bc-rev-ops-comp",
    code: "rev_ops_comp",
    name: "ค่าตอบแทน",
    description: "ค่าตอบแทนวิทยากร ผู้เชี่ยวชาญ และกรรมการ",
    parentId: "bc-rev-ops",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "bc-rev-ops-oper",
    code: "rev_ops_oper",
    name: "ค่าใช้สอย",
    description: "ค่าอาหารและเครื่องดื่ม ค่าที่พัก และค่าเดินทาง",
    parentId: "bc-rev-ops",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "bc-rev-ops-mat",
    code: "rev_ops_mat",
    name: "ค่าวัสดุ",
    description: "ค่าวัสดุอุปกรณ์ และเอกสารสื่อการเรียนรู้",
    parentId: "bc-rev-ops",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 3,
  },

  // 3. Level 2 (หมวดรายจ่ายภายใต้งบลงทุน แผ่นดิน)
  {
    id: "bc-nat-inv-durable",
    code: "nat_inv_durable",
    name: "ค่าครุภัณฑ์",
    description: "อุปกรณ์คอมพิวเตอร์ เครื่องมือวิทยาศาสตร์",
    parentId: "bc-nat-invest",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "bc-nat-inv-land",
    code: "nat_inv_land",
    name: "ค่าที่ดินและสิ่งก่อสร้าง",
    description: "การปรับปรุงอาคารเรียนและห้องปฏิบัติการ",
    parentId: "bc-nat-invest",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 2,
  },

  // 3. Level 2 (หมวดรายจ่ายภายใต้งบพัฒนาวิชาการและวิจัย)
  {
    id: "bc-rev-acad-grant",
    code: "rev_acad_grant",
    name: "ทุนอุดหนุนการวิจัย",
    description: "เงินทุนทำวิจัยเพื่อตีพิมพ์หรือยื่นจดสิทธิบัตร",
    parentId: "bc-rev-academic",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "bc-rev-acad-pub",
    code: "rev_acad_pub",
    name: "ค่าตีพิมพ์บทความ",
    description: "ค่าธรรมเนียมตีพิมพ์ในวารสารระดับชาติ/นานาชาติ (TCI/Scopus)",
    parentId: "bc-rev-academic",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 2,
  },

  // 3. Level 2 (หมวดรายจ่ายภายใต้งบกิจกรรมพัฒนานักศึกษา)
  {
    id: "bc-rev-stu-act",
    code: "rev_stu_act",
    name: "ค่าจัดกิจกรรมนักศึกษา",
    description: "ค่าวัสดุและค่าใช้สอยในกิจกรรมเสริมหลักสูตร",
    parentId: "bc-rev-student",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "bc-rev-stu-award",
    code: "rev_stu_award",
    name: "เงินรางวัลและทุนพัฒนา",
    description: "เงินรางวัลการประกวดนวัตกรรมหรือแข่งขันทักษะ",
    parentId: "bc-rev-student",
    fiscalYear: 2569,
    isActive: true,
    sortOrder: 2,
  },
]

// Default 2569 Form Schema
export const defaultFormTemplate: FormTemplate = {
  id: "tpl-default-2569",
  fiscalYear: 2569,
  title: "แบบฟอร์มเสนอโครงการฉบับทางการ มรภ.ชัยภูมิ (พ.ศ. 2569)",
  description: "เทมเพลตมาตรฐานสำหรับเสนอโครงการและขออนุมัติงบประมาณ",
  isActive: true,
  schema: [
    {
      id: "f_category",
      name: "project_category",
      label: "ประเภทโครงการตามนโยบาย",
      type: "select",
      required: true,
      wordTag: "project_category",
      options: [
        "ตามแผน นโยบาย/จุดเน้นมหาวิทยาลัย",
        "ตามแผนภารกิจหน่วยงาน",
        "นอกแผน นโยบายเร่งด่วนมหาวิทยาลัย",
        "นอกแผน ตามนโยบาย/จุดเน้นยุทธศาสตร์",
        "อื่น ๆ (กรณีงบประมาณจากภายนอก)",
      ],
      helpText: "เลือกประเภทโครงการตามแบบฟอร์ม มรภ.ชัยภูมิ",
    },
    {
      id: "f_mission",
      name: "university_mission",
      label: "ความสอดคล้องกับพันธกิจมหาวิทยาลัย (พ.ศ. 2566 - 2570)",
      type: "select",
      required: true,
      wordTag: "university_mission",
      options: [
        "พันธกิจ 1: ผลิตบัณฑิตที่มีคุณภาพได้มาตรฐาน",
        "พันธกิจ 2: วิจัยสร้างองค์ความรู้และนวัตกรรมเพื่อพัฒนาท้องถิ่น",
        "พันธกิจ 3: ให้บริการวิชาการถ่ายทอดเทคโนโลยีสู่ท้องถิ่น",
        "พันธกิจ 4: อนุรักษ์ ฟื้นฟู ส่งเสริม ศิลปวัฒนธรรมและภูมิปัญญา",
        "พันธกิจ 5: เสริมสร้างความเข้มแข็งของวิชาชีพครูและบุคลากร",
        "พันธกิจ 6: บริหารจัดการมหาวิทยาลัยตามหลักธรรมาภิบาล",
      ],
    },
    {
      id: "f_strategy",
      name: "university_strategy",
      label: "ประเด็นยุทธศาสตร์มหาวิทยาลัย",
      type: "select",
      required: true,
      wordTag: "university_strategy",
      options: [
        "ยุทธศาสตร์ 1: พัฒนาชุมชนท้องถิ่น",
        "ยุทธศาสตร์ 2: ผลิตและพัฒนาครูมืออาชีพ",
        "ยุทธศาสตร์ 3: ยกระดับคุณภาพการศึกษา",
        "ยุทธศาสตร์ 4: พัฒนาระบบบริหารจัดการ",
      ],
    },
    {
      id: "f_rationale",
      name: "rationale",
      label: "หลักการและเหตุผล",
      type: "textarea",
      required: true,
      wordTag: "rationale",
      placeholder: "ระบุที่มา สภาพปัญหา และความจำเป็นที่ต้องจัดทำโครงการ...",
      helpText: "อธิบายปัญหาและแนวทางแก้ไขของหน่วยงาน",
    },
    {
      id: "f_okr",
      name: "okr_objective",
      label: "วัตถุประสงค์และผลลัพธ์หลัก (OKRs)",
      type: "textarea",
      required: true,
      wordTag: "okr_objective",
      placeholder: "ระบุวัตถุประสงค์และค่าเป้าหมาย เช่น ร้อยละ 80...",
    },
    {
      id: "f_impact",
      name: "expected_impact",
      label: "ผลประโยชน์ที่คาดว่าจะได้รับ (Impact)",
      type: "textarea",
      required: false,
      wordTag: "expected_impact",
      placeholder: "ระบุประโยชน์ต่ออาจารย์ นักศึกษา หรือสังคม...",
    },
    {
      id: "f_supervisor",
      name: "supervisor_name",
      label: "ผู้กำกับติดตามโครงการ (ผู้บริหาร)",
      type: "text",
      required: true,
      wordTag: "supervisor_name",
      defaultValue: "ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย",
      helpText: "ตำแหน่ง คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    },
  ],
}

// In-memory fallback caches
let cachedBudgetTypes: BudgetType[] = [...defaultBudgetTypes]
let cachedTemplate: FormTemplate = { ...defaultFormTemplate }

export const templateService = {
  // 1. Budget Types Master Management
  async getBudgetTypes(): Promise<BudgetType[]> {
    try {
      const { data, error } = await supabase
        .from("budget_types")
        .select("*")
        .order("created_at", { ascending: true })

      if (!error && data && data.length > 0) {
        cachedBudgetTypes = data.map((d: any) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          description: d.description,
          fiscalYear: d.fiscal_year,
          isActive: d.is_active,
        }))
        return cachedBudgetTypes
      }
    } catch (e) {
      console.warn("Supabase budget_types fallback:", e)
    }
    return cachedBudgetTypes
  },

  async toggleBudgetType(id: string, isActive: boolean): Promise<boolean> {
    try {
      await supabase
        .from("budget_types")
        .update({ is_active: isActive })
        .eq("id", id)
    } catch {}

    cachedBudgetTypes = cachedBudgetTypes.map((b) =>
      b.id === id ? { ...b, isActive } : b
    )
    return true
  },

  async addBudgetType(
    name: string,
    description: string
  ): Promise<BudgetType> {
    const code = `custom_${Date.now()}`
    const newType: BudgetType = {
      id: `bt-${Date.now()}`,
      code,
      name,
      description,
      fiscalYear: 2569,
      isActive: true,
    }

    try {
      const { data, error } = await supabase
        .from("budget_types")
        .insert({
          code,
          name,
          description,
          is_active: true,
        })
        .select()
        .single()

      if (!error && data) {
        newType.id = data.id
      }
    } catch {}

    cachedBudgetTypes.push(newType)
    return newType
  },

  // 2. Dynamic Form Template Management
  async getActiveTemplate(fiscalYear: number = 2569): Promise<FormTemplate> {
    try {
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .eq("fiscal_year", fiscalYear)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        cachedTemplate = {
          id: data.id,
          fiscalYear: data.fiscal_year,
          title: data.title,
          description: data.description,
          isActive: data.is_active,
          schema: data.schema as FormFieldSchema[],
          wordTemplateUrl: data.word_template_url,
        }
        return cachedTemplate
      }
    } catch (e) {
      console.warn("Supabase form_templates fallback:", e)
    }
    return cachedTemplate
  },

  async saveTemplate(template: FormTemplate): Promise<boolean> {
    try {
      await supabase.from("form_templates").upsert({
        id: template.id.startsWith("tpl-") ? undefined : template.id,
        fiscal_year: template.fiscalYear,
        title: template.title,
        description: template.description,
        is_active: template.isActive,
        schema: template.schema,
      })
    } catch {}

    cachedTemplate = { ...template }
    return true
  },

  // 3. Word Document Generator (docxtemplater)
  // Replaces {{tags}} in a Word docx template with filled form data
  generateDocument(
    templateBinary: ArrayBuffer,
    data: Record<string, any>
  ): Blob {
    const zip = new PizZip(templateBinary)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    // Render the document with dynamic data
    doc.render(data)

    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    return out
  },

  // 4. AI Auto-Mapper Methods (FastAPI + Gemini 3.8 Flash + python-docx)
  async checkBackendHealth(): Promise<boolean> {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8001"
    try {
      const res = await fetch(`${backendUrl}/api/v1/templates/tags`, {
        method: "GET",
        headers: { Accept: "application/json", ...authHeaders() },
        signal: AbortSignal.timeout(3000),
      })
      return res.ok
    } catch {
      return false
    }
  },

  async analyzeDocx(file: File, customTags?: any[]): Promise<any> {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8001"
    const formData = new FormData()
    formData.append("file", file)
    if (customTags && customTags.length > 0) {
      formData.append("custom_tags_json", JSON.stringify(customTags))
    }

    try {
      const res = await fetch(`${backendUrl}/api/v1/templates/auto-map/analyze`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || "เกิดข้อผิดพลาดในการวิเคราะห์เอกสาร")
      }
      return await res.json()
    } catch (e: any) {
      if (e.message?.includes("Failed to fetch") || e.name === "TypeError") {
        throw new Error("ไม่สามารถเชื่อมต่อ Python AI Backend (พอร์ต 8001) ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์ Backend กำลังทำงานอยู่หรือไม่")
      }
      throw e
    }
  },

  async saveAutoMappedTemplate(
    file: File,
    templateName: string,
    confirmedMappings: any[],
    fiscalYear: number = 2570
  ): Promise<any> {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8001"
    const formData = new FormData()
    formData.append("file", file)
    formData.append("template_name", templateName)
    formData.append("mappings_json", JSON.stringify(confirmedMappings))
    formData.append("fiscal_year", fiscalYear.toString())

    try {
      const res = await fetch(`${backendUrl}/api/v1/templates/auto-map/save`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || "เกิดข้อผิดพลาดในการบันทึกเทมเพลต")
      }
      return await res.json()
    } catch (e: any) {
      if (e.message?.includes("Failed to fetch") || e.name === "TypeError") {
        throw new Error("ไม่สามารถเชื่อมต่อ Python AI Backend (พอร์ต 8001) ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์ Backend กำลังทำงานอยู่หรือไม่")
      }
      throw e
    }
  },

  async downloadTestTemplate(file: File, confirmedMappings: any[]): Promise<Blob> {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8001"
    const formData = new FormData()
    formData.append("file", file)
    formData.append("mappings_json", JSON.stringify(confirmedMappings))

    const res = await fetch(`${backendUrl}/api/v1/templates/auto-map/download-test`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    })
    if (!res.ok) {
      throw new Error("ดาวน์โหลดไฟล์ทดสอบไม่สำเร็จ")
    }
    return await res.blob()
  },

  // 5. Hierarchical Budget Categories (Self-referencing tree)
  async getCategories(fiscalYear: number = 2569): Promise<BudgetCategory[]> {
    try {
      const { data, error } = await supabase
        .from("budget_categories")
        .select("*")
        .eq("fiscal_year", fiscalYear)
        .order("sort_order", { ascending: true })

      if (!error && data && data.length > 0) {
        cachedCategories = data.map((d) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          description: d.description,
          parentId: d.parent_id,
          fiscalYear: d.fiscal_year,
          isActive: d.is_active,
          sortOrder: d.sort_order,
        }))
        return cachedCategories
      }
    } catch (e) {
      console.warn("Supabase budget_categories fallback:", e)
    }
    return cachedCategories
  },

  async getCategoryTree(fiscalYear: number = 2569): Promise<BudgetCategory[]> {
    const all = await this.getCategories(fiscalYear)
    return buildCategoryTree(all)
  },

  async addCategory(category: {
    name: string
    description?: string
    parentId?: string | null
    fiscalYear?: number
  }): Promise<BudgetCategory> {
    const code = `cat_${Date.now()}`
    const newCat: BudgetCategory = {
      id: `bc-${Date.now()}`,
      code,
      name: category.name,
      description: category.description || "",
      parentId: category.parentId || null,
      fiscalYear: category.fiscalYear || 2569,
      isActive: true,
      sortOrder: cachedCategories.length + 1,
    }

    try {
      const { data, error } = await supabase
        .from("budget_categories")
        .insert({
          code,
          name: category.name,
          description: category.description,
          parent_id: category.parentId || null,
          fiscal_year: category.fiscalYear || 2569,
          is_active: true,
          sort_order: newCat.sortOrder,
        })
        .select()
        .single()

      if (!error && data) {
        newCat.id = data.id
      }
    } catch {}

    cachedCategories.push(newCat)
    return newCat
  },

  async toggleCategoryActive(id: string, isActive: boolean): Promise<boolean> {
    try {
      await supabase
        .from("budget_categories")
        .update({ is_active: isActive })
        .eq("id", id)
    } catch {}

    cachedCategories = cachedCategories.map((c) =>
      c.id === id ? { ...c, isActive } : c
    )
    return true
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await supabase.from("budget_categories").delete().eq("id", id)
    } catch {}

    cachedCategories = cachedCategories.filter(
      (c) => c.id !== id && c.parentId !== id
    )
    return true
  },
}

let cachedCategories: BudgetCategory[] = [...defaultBudgetCategories]

export function buildCategoryTree(categories: BudgetCategory[]): BudgetCategory[] {
  const map = new Map<string, BudgetCategory>()
  const roots: BudgetCategory[] = []

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] })
  })

  categories.forEach((cat) => {
    const node = map.get(cat.id)!
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}


