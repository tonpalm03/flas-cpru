/**
 * แม่แบบเอกสารกลาง: ค่าเดียวที่ Preview, PDF และ Word ต้องอ่านร่วมกัน
 * ถอดจากไฟล์ .docx ต้นฉบับของแต่ละประเภท กระดาษ A4 ยกเว้นบันทึกข้อความที่ต้นฉบับตั้ง Letter
 */
export interface TemplateMarginsMm {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type PaperKey = 'a4' | 'letter';

export interface AdminTemplateSpec {
  /** ขนาดกระดาษตามต้นฉบับ: บันทึกข้อความตั้ง Letter ที่เหลือ A4 (ค่าเริ่มต้น) */
  paper?: PaperKey;
  margins: TemplateMarginsMm;
  /** ขอบบนเฉพาะหน้าแรก (มม.) ใช้เมื่อหัวเอกสารอยู่สูงกว่าขอบบนของหน้าถัดไป ต้นฉบับบันทึกข้อความวางครุฑสูงกว่าขอบ */
  firstPageTop?: number;
  /** หนังสือภายนอก: ตราครุฑลอยและระยะแนวตั้งของท้ายหนังสือตามต้นฉบับ (วัดจากไฟล์ .docx) */
  letter?: LetterSpec;
  /** คำสั่ง: ตราครุฑลอยกึ่งกลาง ระยะเยื้องและระยะท้ายคำสั่งตามต้นฉบับ (วัดจากไฟล์ .docx) */
  orderLayout?: OrderLayoutSpec;
}

export interface OrderLayoutSpec {
  garuda: { widthMm: number; heightMm: number; topOffsetMm: number };
  /** ความสูงของบล็อกครุฑเหนือบรรทัด "คำสั่ง..." (มม.) */
  headerBlockMm: number;
  /** เยื้องหัวข้อ "๑. คณะกรรมการ..." และคำว่า "หน้าที่" (มม. จากขอบเนื้อหา) */
  headingIndentMm: number;
  /** เยื้องบรรทัด "สั่ง ณ วันที่" (มม. จากขอบเนื้อหา) */
  dateIndentMm: number;
  /** ระยะเว้นก่อนชื่อผู้ลงนาม (มม.) */
  signGapMm: number;
}

export interface LetterSpec {
  /** ตราครุฑ: ขนาดและระยะจากขอบซ้ายของเนื้อหา (มม.) */
  garuda: { widthMm: number; heightMm: number; leftMm: number };
  /** ระยะเว้นก่อน "ขอแสดงความนับถือ" ก่อนชื่อผู้ลงนาม และก่อนข้อมูลผู้ประสานงาน (มม.) */
  closingGapMm: number;
  signGapMm: number;
  coordinatorGapMm: number;
  /** ตำแหน่งบรรทัด "ที่ ..." และที่อยู่จากขอบบนของตราครุฑ (มม.) ใช้กับ Preview/PDF */
  headerTextTopMm: number;
}

export const A4_MM = { width: 210, height: 297 } as const;
export const A4_TWIPS = { width: 11906, height: 16838 } as const;
export const LETTER_MM = { width: 216, height: 279 } as const;
export const LETTER_TWIPS = { width: 12240, height: 15840 } as const;

/** ขนาดกระดาษของประเภทเอกสาร (มม. และ twips) ใช้ร่วมกันโดย Preview, PDF และ Word */
export function getPaper(category = 'memo') {
  const letter = getTemplateSpec(category).paper === 'letter';
  return letter
    ? { key: 'letter' as const, label: 'Letter', cssSize: 'letter portrait', mm: LETTER_MM, twips: LETTER_TWIPS }
    : { key: 'a4' as const, label: 'A4', cssSize: 'A4 portrait', mm: A4_MM, twips: A4_TWIPS };
}

const SIDE = { right: 20, left: 30 };

const SPECS: Record<string, AdminTemplateSpec> = {
  // ต้นฉบับบันทึกข้อความตั้งกระดาษ Letter (12240 x 15840 twips)
  memo: { paper: 'letter', margins: { top: 25, bottom: 22.5, ...SIDE }, firstPageTop: 16.5 },
  memo_circular: { margins: { top: 20, bottom: 20, ...SIDE }, firstPageTop: 16 },
  order: {
    margins: { top: 17.5, bottom: 20, ...SIDE },
    orderLayout: {
      garuda: { widthMm: 29.1, heightMm: 30, topOffsetMm: -0.9 },
      headerBlockMm: 34.9,
      headingIndentMm: 25.4,
      dateIndentMm: 38.1,
      signGapMm: 37.6
    }
  },
  // ต้นฉบับตั้งขอบล่างไว้ 0.5 ซม. ซึ่งเป็นความผิดพลาดของไฟล์ ใช้ 2.0 ซม. แทน
  external: {
    margins: { top: 17.5, bottom: 20, ...SIDE },
    letter: { garuda: { widthMm: 30.4, heightMm: 30, leftMm: 62.3 }, closingGapMm: 15.9, signGapMm: 23.5, coordinatorGapMm: 30, headerTextTopMm: 26.2 }
  },
  // ต้นฉบับตั้งขอบบน 2.54 ซม. แต่ตราครุฑลอยเหนือขอบ ตำแหน่งจริงเท่ากับหนังสือภายนอกคือ 1.75 ซม.
  external_circular: {
    margins: { top: 17.5, bottom: 17.5, ...SIDE },
    letter: { garuda: { widthMm: 31, heightMm: 29.4, leftMm: 57.7 }, closingGapMm: 12.1, signGapMm: 30.1, coordinatorGapMm: 19.5, headerTextTopMm: 23.4 }
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
