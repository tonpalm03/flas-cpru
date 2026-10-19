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
  /** บันทึกข้อความ: จุดสิ้นสุดเส้นประหัวเรื่อง (twips จากขอบซ้ายเนื้อหา) ไม่กำหนด = ชิดขอบขวา */
  headerFillTwips?: number;
  margins: TemplateMarginsMm;
  /** ขอบบนเฉพาะหน้าแรก (มม.) ใช้เมื่อหัวเอกสารอยู่สูงกว่าขอบบนของหน้าถัดไป ต้นฉบับบันทึกข้อความวางครุฑสูงกว่าขอบ */
  firstPageTop?: number;
  /** บล็อกลงนาม (ตำแหน่งแนวนอน และระยะแนวตั้งของบันทึกข้อความ) วัดจากต้นฉบับที่เปิดใน Microsoft Word */
  sign: SignSpec;
  /** หนังสือภายนอก: ตราครุฑลอยและระยะแนวตั้งของท้ายหนังสือตามต้นฉบับ (วัดจากไฟล์ .docx) */
  letter?: LetterSpec;
  /** คำสั่ง: ตราครุฑลอยกึ่งกลาง ระยะเยื้องและระยะท้ายคำสั่งตามต้นฉบับ (วัดจากไฟล์ .docx) */
  orderLayout?: OrderLayoutSpec;
}

export interface SignSpec {
  /** เยื้องซ้ายของย่อหน้าชื่อและตำแหน่งผู้ลงนาม (มม. จากขอบเนื้อหา) ข้อความจัดกึ่งกลางในช่วงที่เหลือ
   *  ต้นฉบับวางด้วยการเคาะวรรค จึงเลือกเยื้องให้กึ่งกลางชื่อตรงกับต้นฉบับ */
  indentMm: number;
  /** เยื้องของ "ขอแสดงความนับถือ" ถ้าต่างจากชื่อ (หนังสือภายนอก) */
  closingIndentMm?: number;
  /** บันทึกข้อความ: ระยะเว้นก่อนชื่อผู้ลงนาม (มม.) ประเภทอื่นใช้ letter/orderLayout.signGapMm */
  gapMm?: number;
  /** ระยะเว้นเพิ่มก่อนบรรทัดตำแหน่ง (มม.) */
  positionGapMm?: number;
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

/** จุดสิ้นสุดเส้นประหัวเรื่องบันทึกข้อความ (twips) ใช้ทั้งแม่แบบ Word และตัวสร้างสำรอง */
export function getHeaderFillTwips(category = 'memo'): number {
  const spec = getTemplateSpec(category);
  const m = wordMargin(spec.margins);
  return spec.headerFillTwips ?? getPaper(category).twips.width - m.left - m.right - 1;
}

const SIDE = { right: 20, left: 30 };

const SPECS: Record<string, AdminTemplateSpec> = {
  // ต้นฉบับบันทึกข้อความตั้งกระดาษ Letter (12240 x 15840 twips)
  // เส้นประหัวเรื่องในต้นฉบับจบที่ 19.51 ซม. จากขอบกระดาษ (วัดจาก PDF ที่ Word พิมพ์) = 9360 twips จากขอบเนื้อหา
  memo: {
    paper: 'letter', headerFillTwips: 9360, margins: { top: 25, bottom: 22.5, ...SIDE }, firstPageTop: 16.5,
    // กึ่งกลางชื่อ 14.05 ซม. จากขอบกระดาษ เว้นจาก "จึงเรียน" 4.22 ซม. ชื่อถึงตำแหน่ง 0.75 ซม.
    sign: { indentMm: 55.2, gapMm: 35.76, positionGapMm: 1.1 }
  },
  // กึ่งกลางชื่อ 14.05 ซม. จากขอบกระดาษ เว้นจาก "จึงเรียน" 4.47 ซม.
  memo_circular: { margins: { top: 20, bottom: 20, ...SIDE }, firstPageTop: 16, sign: { indentMm: 61, gapMm: 38.24 } },
  order: {
    margins: { top: 17.5, bottom: 20, ...SIDE },
    // กึ่งกลางชื่อ 13.95 ซม. จากขอบกระดาษ
    sign: { indentMm: 59 },
    orderLayout: {
      garuda: { widthMm: 29.1, heightMm: 30, topOffsetMm: -0.9 },
      headerBlockMm: 34.9,
      headingIndentMm: 25.4,
      dateIndentMm: 38.1,
      signGapMm: 32
    }
  },
  // ต้นฉบับตั้งขอบล่างไว้ 0.5 ซม. ซึ่งเป็นความผิดพลาดของไฟล์ ใช้ 2.0 ซม. แทน
  external: {
    margins: { top: 17.5, bottom: 20, ...SIDE },
    sign: { indentMm: 40 },
    letter: { garuda: { widthMm: 30.4, heightMm: 30, leftMm: 62.3 }, closingGapMm: 15.9, signGapMm: 21.5, coordinatorGapMm: 25.6, headerTextTopMm: 26.2 }
  },
  // ต้นฉบับตั้งขอบบน 2.54 ซม. แต่ตราครุฑลอยเหนือขอบ ตำแหน่งจริงเท่ากับหนังสือภายนอกคือ 1.75 ซม.
  external_circular: {
    margins: { top: 17.5, bottom: 17.5, ...SIDE },
    // ต้นฉบับวาง "ขอแสดงความนับถือ" เยื้องซ้ายกว่าชื่อเล็กน้อย
    sign: { indentMm: 38.2, closingIndentMm: 35.6 },
    letter: { garuda: { widthMm: 31, heightMm: 29.4, leftMm: 57.7 }, closingGapMm: 10.8, signGapMm: 25.6, coordinatorGapMm: 18.2, headerTextTopMm: 23.4 }
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

/**
 * รูปลายเซ็น e-Signature: ประทับเหนือชื่อผู้ลงนามแบบลอย ไม่ดันข้อความ ชื่อและระยะคงตามต้นแบบ
 * ย่อ/ขยายตามสัดส่วนให้พอดีกรอบ กว้างไม่เกิน 4 ซม. สูงไม่เกิน 1.5 ซม. ขอบล่างเหนือตัวอักษรของชื่อ 1 มม.
 */
export const SIGNATURE_BOX = { maxWidthMm: 40, maxHeightMm: 15, gapAboveNameMm: 1 } as const;

/** ขนาดรูปลายเซ็น (มม.) ตามสัดส่วนรูปจริง ไม่ทราบขนาดรูปใช้เต็มกรอบ */
export function fitSignatureMm(px?: { width: number; height: number } | null): { width: number; height: number } {
  const { maxWidthMm: W, maxHeightMm: H } = SIGNATURE_BOX;
  if (!px || px.width <= 0 || px.height <= 0) return { width: W, height: H };
  const scale = Math.min(W / px.width, H / px.height);
  return { width: px.width * scale, height: px.height * scale };
}
