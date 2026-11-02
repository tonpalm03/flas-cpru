import { CodeLabel, MultiplierBudgetItem, ProjectActivityDefinition } from "../types/plan"
import { formatMoney, formatBahtText } from "./formatters"

export interface ExportMultiplierOptions {
  projectName: string
  fiscalYear: number
  facultyOrUnit?: string
  activities?: ProjectActivityDefinition[]
  multiplierItems?: MultiplierBudgetItem[]
  // ชื่อหมวด/แหล่งงบของปีงบ (ไม่ส่งมาใช้ชุดเริ่มต้น)
  expenseCategories?: CodeLabel[]
  budgetSources?: CodeLabel[]
}

const DEFAULT_CATEGORIES: CodeLabel[] = [
  { code: "compensation", label: "ค่าตอบแทน" },
  { code: "operations", label: "ค่าใช้สอย" },
  { code: "materials", label: "ค่าวัสดุ" },
  { code: "other", label: "ค่าใช้จ่ายอื่น ๆ" },
]

/**
 * ส่งออกไฟล์ Excel (.xls) ตารางรายละเอียดแตกตัวคูณงบประมาณ
 * ตามโครงสร้างทางการ มรภ.ชัยภูมิ
 */
export function exportMultiplierToExcel(options: ExportMultiplierOptions) {
  const {
    projectName,
    fiscalYear,
    facultyOrUnit = "มหาวิทยาลัยราชภัฏชัยภูมิ",
    multiplierItems = [],
    expenseCategories = DEFAULT_CATEGORIES,
    budgetSources = [],
  } = options

  // คำนวณยอดรวม
  const grandTotal = multiplierItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
  const thaiText = formatBahtText(grandTotal)

  let rowsHtml = ""
  let rowNo = 1

  const renderSection = (title: string, items: MultiplierBudgetItem[], subtotal: number) => {
    let html = `
      <tr style="background-color: #E8F5E9; font-weight: bold;">
        <td style="border: 1px solid #999; text-align: center;">${rowNo++}</td>
        <td colspan="7" style="border: 1px solid #999; text-align: left; padding: 6px;">${title}</td>
        <td style="border: 1px solid #999; text-align: right; padding: 6px;">${formatMoney(subtotal)}</td>
      </tr>
    `

    items.forEach((item) => {
      const fundLabel = budgetSources.find((source) => source.code === item.fundSource)?.label || item.fundSource
      html += `
        <tr>
          <td style="border: 1px solid #ccc; text-align: center;"></td>
          <td style="border: 1px solid #ccc; text-align: left; padding-left: 20px;">- ${item.name}</td>
          <td style="border: 1px solid #ccc; text-align: center;">${item.targetQty || 0}</td>
          <td style="border: 1px solid #ccc; text-align: center;">${item.targetUnit || "คน"}</td>
          <td style="border: 1px solid #ccc; text-align: center;">${item.durationQty || 1}</td>
          <td style="border: 1px solid #ccc; text-align: center;">${item.durationUnit || "ชม."}</td>
          <td style="border: 1px solid #ccc; text-align: right;">${formatMoney(item.unitRate || 0)}</td>
          <td style="border: 1px solid #ccc; text-align: center;">${item.frequencyQty || 1} ${item.frequencyUnit || "ครั้ง"}</td>
          <td style="border: 1px solid #ccc; text-align: right; font-weight: bold;">${formatMoney(item.totalAmount || 0)}</td>
        </tr>
      `
    })

    return html
  }

  expenseCategories.forEach((category, index) => {
    const items = multiplierItems.filter((i) => i.category === category.code)
    rowsHtml += renderSection(`${index + 1}. ${category.label}`, items, items.reduce((s, i) => s + (i.totalAmount || 0), 0))
  })

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <style>
        body { font-family: 'TH Sarabun PSK', 'Angsana New', Tahoma, sans-serif; font-size: 14pt; }
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #163A35; color: white; border: 1px solid #000; padding: 8px; text-align: center; }
        td { padding: 5px; font-size: 13pt; }
        .header-title { font-size: 18pt; font-weight: bold; text-align: center; }
        .header-sub { font-size: 15pt; text-align: center; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="9" class="header-title">รายละเอียดแตกตัวคูณงบประมาณ ประจำปีงบประมาณ พ.ศ. ${fiscalYear}</td>
        </tr>
        <tr>
          <td colspan="9" class="header-sub">โครงการ: ${projectName || "-"}</td>
        </tr>
        <tr>
          <td colspan="9" class="header-sub">หน่วยงาน: ${facultyOrUnit} | มหาวิทยาลัยราชภัฏชัยภูมิ</td>
        </tr>
        <tr><td colspan="9"></td></tr>
        <thead>
          <tr>
            <th rowspan="2" style="width: 50px;">ลำดับที่</th>
            <th rowspan="2" style="width: 320px;">รายการงบประมาณ / กิจกรรม</th>
            <th colspan="2">กลุ่มเป้าหมาย</th>
            <th colspan="2">ระยะเวลา</th>
            <th rowspan="2" style="width: 100px;">อัตรา/งบประมาณ (บาท)</th>
            <th rowspan="2" style="width: 90px;">จำนวนครั้ง</th>
            <th rowspan="2" style="width: 120px;">รวมทั้งสิ้น (บาท)</th>
          </tr>
          <tr>
            <th style="width: 65px;">จำนวน</th>
            <th style="width: 65px;">หน่วยนับ</th>
            <th style="width: 65px;">จำนวน</th>
            <th style="width: 65px;">หน่วยนับ</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="background-color: #C8E6C9; font-weight: bold; font-size: 15pt;">
            <td colspan="8" style="border: 2px solid #2E7D32; text-align: right; padding: 10px;">
              รวมทั้งสิ้น (${thaiText}):
            </td>
            <td style="border: 2px solid #2E7D32; text-align: right; padding: 10px; color: #1B5E20;">
              ${formatMoney(grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `

  const blob = new Blob(["\ufeff", excelContent], {
    type: "application/vnd.ms-excel;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `รายละเอียดแตกตัวคูณ_${fiscalYear}_${(projectName || "โครงการ").substring(0, 30)}.xls`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
