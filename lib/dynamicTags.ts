// Dynamic Data Binding & Calculation Engine for Universal Documents
// Implements Blueprint Section 11 in AGENTS.md: Dynamic Data Binding Tags

export interface DynamicTagContext {
  projectName?: string;
  projectCode?: string;
  projectFiscalYear?: number | string;
  strategicObjective?: string;
  totalAmount?: number;
  vatRate?: number;            // Default 7% (0.07)
  withholdingTaxRate?: number; // Default 1% (0.01)
  docNumber?: string;
  docDate?: string;
  requesterName?: string;
  requesterPosition?: string;
  signatoryName?: string;
  signatoryPosition?: string;
  departmentName?: string;
  facultyName?: string;
  customFields?: Record<string, string | number>;
}

export interface DynamicTagDefinition {
  tag: string;
  label: string;
  category: "โครงการและแผนงาน" | "การเงินและการคำนวณ" | "สารบรรณและบุคคล" | "ทั่วไป";
  example: string;
}

export const AVAILABLE_DYNAMIC_TAGS: DynamicTagDefinition[] = [
  // Finance & Calculation
  { tag: "{ยอดเงินรวม}", label: "ยอดเงินรวมทั้งสิ้น (ตัวเลข)", category: "การเงินและการคำนวณ", example: "100,000.00" },
  { tag: "{VAT}", label: "ภาษีมูลค่าเพิ่ม 7%", category: "การเงินและการคำนวณ", example: "7,000.00" },
  { tag: "{ภาษีหักณที่จ่าย}", label: "ภาษีหัก ณ ที่จ่าย 1%", category: "การเงินและการคำนวณ", example: "1,000.00" },
  { tag: "{ยอดสุทธิ}", label: "ยอดเงินสุทธิหลังหักภาษี", category: "การเงินและการคำนวณ", example: "99,000.00" },
  { tag: "{จำนวนเงินตัวอักษร}", label: "จำนวนเงินภาษาไทย (บาทถ้วน)", category: "การเงินและการคำนวณ", example: "หนึ่งแสนบาทถ้วน" },
  
  // Projects & Planning
  { tag: "{โครงการ}", label: "ชื่อโครงการ", category: "โครงการและแผนงาน", example: "โครงการส่งเสริมศักยภาพบัณฑิตพันธุ์ใหม่" },
  { tag: "{รหัสโครงการ}", label: "รหัสโครงการ", category: "โครงการและแผนงาน", example: "PRJ-2569-001" },
  { tag: "{ยุทธศาสตร์}", label: "ยุทธศาสตร์ / ตัวชี้วัด", category: "โครงการและแผนงาน", example: "ยุทธศาสตร์ที่ 1 การพัฒนาการศึกษา" },
  { tag: "{ปีงบประมาณ}", label: "ปีงบประมาณ พ.ศ.", category: "โครงการและแผนงาน", example: "2569" },

  // Admin & HR
  { tag: "{เลขที่เอกสาร}", label: "เลขที่หนังสือ / เลขทะเบียนคุม", category: "สารบรรณและบุคคล", example: "อว 0646.02/101" },
  { tag: "{วันที่}", label: "วันที่ปัจจุบัน (แบบทางการ)", category: "สารบรรณและบุคคล", example: "8 ตุลาคม 2569" },
  { tag: "{ผู้ลงนาม}", label: "ชื่อผู้ลงนาม", category: "สารบรรณและบุคคล", example: "ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย" },
  { tag: "{ตำแหน่งผู้ลงนาม}", label: "ตำแหน่งผู้ลงนาม", category: "สารบรรณและบุคคล", example: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์" },
  { tag: "{ผู้ขออนุมัติ}", label: "ชื่อผู้เสนอ / ผู้ขออนุมัติ", category: "สารบรรณและบุคคล", example: "ดร.สมชาย ใจดี" },
  { tag: "{ตำแหน่งผู้ขออนุมัติ}", label: "ตำแหน่งผู้ขออนุมัติ", category: "สารบรรณและบุคคล", example: "ประธานหลักสูตรศิลปศาสตรบัณฑิต" },
  { tag: "{หน่วยงาน}", label: "ชื่อคณะ / สังกัด", category: "ทั่วไป", example: "คณะศิลปศาสตร์และวิทยาศาสตร์" },
];

// Convert numeric number to Thai Baht text format
export function numberToThaiBaht(amount: number): string {
  if (isNaN(amount)) return "ศูนย์บาทถ้วน";
  if (amount === 0) return "ศูนย์บาทถ้วน";

  const numStr = Math.abs(amount).toFixed(2);
  const [bahtPart, satangPart] = numStr.split(".");

  const thaiDigits = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const thaiPositions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  function convertGroup(digits: string): string {
    let result = "";
    const len = digits.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(digits[i], 10);
      const pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 0 && digit === 1 && len > 1 && parseInt(digits[len - 2], 10) !== 0) {
          result += "เอ็ด";
        } else if (pos === 1 && digit === 2) {
          result += "ยี่สิบ";
        } else if (pos === 1 && digit === 1) {
          result += "สิบ";
        } else {
          result += thaiDigits[digit] + thaiPositions[pos];
        }
      }
    }
    return result;
  }

  let text = "";
  if (bahtPart.length > 6) {
    const millions = bahtPart.substring(0, bahtPart.length - 6);
    const remainder = bahtPart.substring(bahtPart.length - 6);
    text += convertGroup(millions) + "ล้าน" + convertGroup(remainder);
  } else {
    text += convertGroup(bahtPart);
  }

  text += "บาท";

  if (satangPart === "00" || satangPart === "0") {
    text += "ถ้วน";
  } else {
    text += convertGroup(satangPart) + "สตางค์";
  }

  return (amount < 0 ? "ลบ" : "") + text;
}

// Financial calculations
export function calculateFinancialTags(
  baseAmount: number,
  vatRate: number = 0.07,
  withholdingTaxRate: number = 0.01
) {
  const vat = baseAmount * vatRate;
  const withholdingTax = baseAmount * withholdingTaxRate;
  const netAmount = baseAmount - withholdingTax;

  return {
    baseAmount,
    vat,
    withholdingTax,
    netAmount,
    formattedBaseAmount: baseAmount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    formattedVat: vat.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    formattedWithholding: withholdingTax.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    formattedNet: netAmount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    thaiBahtText: numberToThaiBaht(baseAmount)
  };
}

// Substitute tags in document content
export function resolveDynamicTags(content: string, context: DynamicTagContext = {}): string {
  if (!content) return "";

  const totalAmount = context.totalAmount ?? 0;
  const vatRate = context.vatRate ?? 0.07;
  const withRate = context.withholdingTaxRate ?? 0.01;
  const calc = calculateFinancialTags(totalAmount, vatRate, withRate);

  const tagMap: Record<string, string> = {
    "{โครงการ}": context.projectName || "โครงการที่ได้รับอนุมัติ",
    "{รหัสโครงการ}": context.projectCode || "PRJ-2569",
    "{ยุทธศาสตร์}": context.strategicObjective || "ยุทธศาสตร์การพัฒนาการศึกษา",
    "{ปีงบประมาณ}": String(context.projectFiscalYear || "2569"),
    "{ยอดเงินรวม}": calc.formattedBaseAmount,
    "{VAT}": calc.formattedVat,
    "{ภาษีหักณที่จ่าย}": calc.formattedWithholding,
    "{ยอดสุทธิ}": calc.formattedNet,
    "{จำนวนเงินตัวอักษร}": calc.thaiBahtText,
    "{เลขที่เอกสาร}": context.docNumber || "อว 0646.02/...",
    "{วันที่}": context.docDate || new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }),
    "{ผู้ลงนาม}": context.signatoryName || "ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย",
    "{ตำแหน่งผู้ลงนาม}": context.signatoryPosition || "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    "{ผู้ขออนุมัติ}": context.requesterName || "บุคลากรประจำคณะ",
    "{ตำแหน่งผู้ขออนุมัติ}": context.requesterPosition || "อาจารย์ประจำคณะศิลปศาสตร์และวิทยาศาสตร์",
    "{หน่วยงาน}": context.facultyName || "คณะศิลปศาสตร์และวิทยาศาสตร์"
  };

  // Add custom fields
  if (context.customFields) {
    Object.entries(context.customFields).forEach(([key, val]) => {
      tagMap[`{${key}}`] = String(val);
    });
  }

  let resolved = content;
  Object.entries(tagMap).forEach(([tag, value]) => {
    resolved = resolved.split(tag).join(value);
  });

  return resolved;
}
