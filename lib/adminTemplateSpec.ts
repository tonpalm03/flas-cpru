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
  /** หนังสือภายนอก: ตราครุฑลอยและระยะแนวตั้งของท้ายหนังสือตามต้นฉบับ (วัดจากไฟล์ .docx) */
  letter?: LetterSpec;
}

export interface LetterSpec {
  /** ตราครุฑ: ขนาดและระยะจากขอบซ้ายของเนื้อหา (มม.) */
  garuda: { widthMm: number; heightMm: number; leftMm: number };
  /** ระยะเว้นก่อน "ขอแสดงความนับถือ" ก่อนชื่อผู้ลงนาม และก่อนข้อมูลผู้ประสานงาน (มม.) */
  closingGapMm: number;
  signGapMm: number;
  coordinatorGapMm: number;
}

export const A4_MM = { width: 210, height: 297 } as const;
export const A4_TWIPS = { width: 11906, height: 16838 } as const;

const SIDE = { right: 20, left: 30 };

const SPECS: Record<string, AdminTemplateSpec> = {
  memo: { margins: { top: 25, bottom: 22.5, ...SIDE }, firstPageTop: 16.5 },
  memo_circular: { margins: { top: 20, bottom: 20, ...SIDE }, firstPageTop: 16 },
  order: { margins: { top: 17.5, bottom: 20, ...SIDE } },
  // ต้นฉบับตั้งขอบล่างไว้ 0.5 ซม. ซึ่งเป็นความผิดพลาดของไฟล์ ใช้ 2.0 ซม. แทน
  external: {
    margins: { top: 17.5, bottom: 20, ...SIDE },
    letter: { garuda: { widthMm: 30.4, heightMm: 30, leftMm: 62.3 }, closingGapMm: 15.9, signGapMm: 23.5, coordinatorGapMm: 30 }
  },
  // ต้นฉบับตั้งขอบบน 2.54 ซม. แต่ตราครุฑลอยเหนือขอบ ตำแหน่งจริงเท่ากับหนังสือภายนอกคือ 1.75 ซม.
  external_circular: {
    margins: { top: 17.5, bottom: 17.5, ...SIDE },
    letter: { garuda: { widthMm: 31, heightMm: 29.4, leftMm: 57.7 }, closingGapMm: 12.1, signGapMm: 30.1, coordinatorGapMm: 19.5 }
  }
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
