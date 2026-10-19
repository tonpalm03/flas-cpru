/**
 * แม่แบบเอกสารกลาง: ค่าเดียวที่ Preview, PDF และ Word ต้องอ่านร่วมกัน
 * ถอดจากไฟล์ .docx ต้นฉบับของแต่ละประเภท กระดาษ A4 ทั้งหมด
 */
export interface TemplateMarginsMm {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AdminTemplateSpec {
  margins: TemplateMarginsMm;
  /** ขอบบนเฉพาะหน้าแรก (มม.) ใช้เมื่อหัวเอกสารอยู่สูงกว่าขอบบนของหน้าถัดไป ต้นฉบับบันทึกข้อความวางครุฑสูงกว่าขอบ */
  firstPageTop?: number;
}

export const A4_MM = { width: 210, height: 297 } as const;
export const A4_TWIPS = { width: 11906, height: 16838 } as const;

const SIDE = { right: 20, left: 30 };

const SPECS: Record<string, AdminTemplateSpec> = {
  memo: { margins: { top: 25, bottom: 22.5, ...SIDE }, firstPageTop: 16.5 },
  memo_circular: { margins: { top: 20, bottom: 20, ...SIDE }, firstPageTop: 16 },
  order: { margins: { top: 17.5, bottom: 20, ...SIDE } },
  // ต้นฉบับตั้งขอบล่างไว้ 0.5 ซม. ซึ่งเป็นความผิดพลาดของไฟล์ ใช้ 2.0 ซม. แทน
  external: { margins: { top: 17.5, bottom: 20, ...SIDE } },
  // ต้นฉบับตั้งขอบบน 2.54 ซม. แต่ตราครุฑลอยเหนือขอบ ตำแหน่งจริงเท่ากับหนังสือภายนอกคือ 1.75 ซม.
  external_circular: { margins: { top: 17.5, bottom: 17.5, ...SIDE } }
};

export function getTemplateSpec(category = 'memo'): AdminTemplateSpec {
  return SPECS[category] || SPECS.memo;
}

export const mmToTwips = (mm: number) => Math.round((mm / 25.4) * 1440);

export function cssMargin(m: TemplateMarginsMm): string {
  return `${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm`;
}

export function wordMargin(m: TemplateMarginsMm) {
  return {
    top: mmToTwips(m.top),
    right: mmToTwips(m.right),
    bottom: mmToTwips(m.bottom),
    left: mmToTwips(m.left)
  };
}
