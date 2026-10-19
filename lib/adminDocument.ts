import type { AdminDocCategory, AdminDocRegistryRecord } from './types';
import { PAGE_BREAK_BLOCK_XML, PAGE_BREAK_XML, blocksToWordXml, imagePixelSize, loadWordTemplate, renderWordTemplate, xmlFloatingImageRun, xmlPara, xmlRun, xmlTab, type TemplateImage, type XmlParaOptions } from './wordTemplate';
import { INDENT_STEP_MM, INDENT_STEP_TWIPS, PAGE_BREAK_TEXT, getBodyBlocks, newBlock, type RichBlock } from './richBody';
import { SIGNATURE_BOX, cssMargin, fitSignatureMm, getHeaderFillTwips, getPaper, getTemplateSpec, mmToTwips, wordMargin } from './adminTemplateSpec';

export function garudaPath(category: string, garudaImage?: string) {
  if (garudaImage) return garudaImage;
  if (category.startsWith('memo')) return '/templates/admin/garuda-memo.png';
  if (category === 'order') return '/templates/admin/garuda-order.png';
  return '/templates/admin/garuda-external.png';
}

export const toThaiDigits = (value: unknown): string =>
  String(value ?? '').replace(/[0-9]/g, digit => '๐๑๒๓๔๕๖๗๘๙'[Number(digit)]);

export const toArabicDigits = (value: unknown): string =>
  String(value ?? '').replace(/[๐-๙]/g, digit => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(digit)));

export const formatDocDigits = (value: unknown, digitType: 'thai' | 'arabic' = 'thai'): string =>
  digitType === 'arabic' ? toArabicDigits(value) : toThaiDigits(value);

export function getRecordDigitType(r: Partial<AdminDocRegistryRecord>): 'thai' | 'arabic' {
  if (r.digitType === 'arabic' || r.digitType === 'thai') return r.digitType;
  return r.category === 'external' ? 'arabic' : 'thai';
}

export function thaiGovDate(
  value: string,
  digitType: 'thai' | 'arabic' = 'thai',
  mode: 'external' | 'memo' | 'order' | 'full' = 'memo'
): string {
  if (!value) return '(ยังไม่ระบุวันที่)';
  const d = new Date(value + 'T12:00:00+07:00');
  if (Number.isNaN(d.getTime())) return '(ยังไม่ระบุวันที่)';
  const day = d.getDate();
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;

  let res = '';
  if (mode === 'order') {
    res = `สั่ง ณ วันที่ ${day} เดือน ${month} พ.ศ. ${year}`;
  } else if (mode === 'full') {
    res = `วันที่ ${day} เดือน ${month} พ.ศ. ${year}`;
  } else if (mode === 'external') {
    res = `${day} ${month} ${year}`;
  } else {
    // memo format
    res = `${day} ${month} ${year}`;
  }
  return formatDocDigits(res, digitType);
}

export function thaiDate(value: string, digitType: 'thai' | 'arabic' = 'thai') {
  return thaiGovDate(value, digitType, 'memo');
}

export function formatSignatoryName(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '';
  return trimmed.replace(/\s+/g, ' ');
}

/**
 * ตำแหน่งรูปลายเซ็นลอยเหนือชื่อผู้ลงนาม (มม.): กึ่งกลางตรงกับชื่อ (ช่วงหลังเยื้องบล็อกลงนาม)
 * ขอบล่างของรูปอยู่เหนือตัวอักษรของชื่อ SIGNATURE_BOX.gapAboveNameMm
 * top วัดจากบนบรรทัดชื่อ (ติดลบ = เหนือบรรทัด) ตัวอักษรเริ่มต่ำกว่าบนบรรทัด NAME_GLYPH_TOP_MM
 * ใน Word ตำแหน่ง "line" นับจากบนระยะเว้นก่อนย่อหน้า จึงต้องบวกระยะเว้นก่อนชื่อ (spaceBeforeMm)
 */
// วัดจาก Word และ Chrome: ขอบบนตัวอักษรของชื่อเทียบกับจุดอ้างอิงของแต่ละโปรแกรม
const NAME_GLYPH_TOP_MM = { word: 0.15, html: -0.12 };
// Word วางรูปตามบรรทัดโดยหักระยะเว้นหลังย่อหน้าก่อนหน้า ("ขอแสดงความนับถือ"/"สั่ง ณ วันที่" เว้นหลัง 3 พอยต์)
const PREV_SPACE_AFTER_MM = 60 / 56.693;
export function signaturePlacementMm(category: string, size: { width: number; height: number }, target: 'word' | 'html', spaceBeforeMm = 0) {
  const spec = getTemplateSpec(category);
  const textWidth = getPaper(category).mm.width - spec.margins.left - spec.margins.right;
  const centre = spec.sign.indentMm + (textWidth - spec.sign.indentMm) / 2;
  const prevAfter = target === 'word' && category !== 'memo' && category !== 'memo_circular' ? PREV_SPACE_AFTER_MM : 0;
  return { left: centre - size.width / 2, top: spaceBeforeMm - prevAfter + NAME_GLYPH_TOP_MM[target] - SIGNATURE_BOX.gapAboveNameMm - size.height };
}

/** ชื่อเดียวกันหรือไม่ โดยไม่สนคำนำหน้า/ตำแหน่งวิชาการ (ผศ. = ผู้ช่วยศาสตราจารย์, ดร., นาย ฯลฯ) และช่องว่าง */
export function isSamePerson(a: string, b: string): boolean {
  const key = (n: string) => {
    let s = (n || '').replace(/[\s.]/g, '');
    const prefixes = ['ผู้ช่วยศาสตราจารย์', 'รองศาสตราจารย์', 'ศาสตราจารย์', 'ผศ', 'รศ', 'ดร', 'นางสาว', 'นาง', 'นาย', 'อาจารย์'];
    for (let changed = true; changed; ) {
      changed = false;
      for (const p of prefixes) {
        if (s.startsWith(p) && s.length > p.length + 2) {
          s = s.slice(p.length);
          changed = true;
        }
      }
    }
    return s;
  };
  const ka = key(a);
  return ka !== '' && ka === key(b);
}

export function sanitizeFieldText(text: string, keyword?: string): string {
  let clean = (text || '').trim().replace(/[ \t]{3,}/g, '  ');
  if (keyword) {
    const regex = new RegExp(`^${keyword}\\s*`, 'i');
    clean = clean.replace(regex, '').trim();
  }
  return clean;
}

/** ตัวแบ่งหน้าใน Preview/PDF: เนื้อหาถัดไปเริ่มหน้าใหม่ เว้นหนึ่งบรรทัดเหมือนย่อหน้าตัวแบ่งหน้าใน Word */
const PAGE_BREAK_HTML = '<div class="page-break" style="break-before: page; height: 0; margin: 0;"></div><div style="height: 6.4mm; margin: 0;"></div>';

const escape = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const lines = (v: unknown) => escape(v).replace(/\n/g, '<br>');

export function orderBlocks(paragraphs: string[]) {
  const blocks: string[] = [];
  for (const raw of paragraphs.join("\n").split("\n")) {
    const line = raw.trim().replace(/[ \t]{2,}/g, " ");
    if (!line) continue;
    if (!blocks.length || /^(?:[๐-๙0-9]+(?:\.[๐-๙0-9]+)*[\.\s]|หน้าที่|ดังนั้น|ให้คณะกรรมการ|ทั้งนี้|สั่ง ณ)/.test(line)) {
      blocks.push(line);
    } else {
      blocks[blocks.length - 1] += " " + line;
    }
  }
  return blocks;
}

/**
 * แบ่งเนื้อหาคำสั่งเป็นรายการพร้อมข้อความล้วนสำหรับจัดประเภท (หัวข้อ/รายชื่อกรรมการ/หน้าที่)
 * ใช้ร่วมกันทั้ง Preview และ Word เพื่อให้ผลตรงกัน
 */
export function orderItems(blocks: RichBlock[]): { text: string; block: RichBlock }[] {
  const out: { text: string; block: RichBlock }[] = [];
  for (const b of blocks) {
    if (b.pageBreak) {
      out.push({ text: PAGE_BREAK_TEXT, block: b });
      continue;
    }
    const ls = orderBlocks([b.text]);
    if (ls.length === 1 && ls[0] === b.text.trim().replace(/[ \t]{2,}/g, ' ')) {
      out.push({ text: ls[0], block: b });
    } else {
      for (const l of ls) out.push({ text: l, block: newBlock(l, { align: b.align, firstLine: b.firstLine, indent: b.indent }) });
    }
  }
  return out;
}

/**
 * รูปแบบย่อหน้าเนื้อหาคำสั่งตามไฟล์ต้นฉบับ (twips) ใช้ร่วมกันทั้ง Word, ตัวสร้างสำรอง และ Preview/PDF
 * - ย่อหน้าแรก ("ด้วย..."): ต้นฉบับเคาะ 16 วรรค (19.5 มม.) และใช้ระยะบรรทัดเริ่มต้นของ Word (1.08 เว้นหลัง 8 พอยต์)
 * - ย่อหน้าอื่นก่อนรายชื่อ ("ดังนั้น..."): เยื้อง 2.5 ซม. เว้นก่อน 6 พอยต์
 * - ย่อหน้าหลังรายชื่อ ("ให้คณะกรรมการ..."): เยื้อง 2.5 ซม. เว้นก่อน 12 พอยต์ หลัง 8 พอยต์
 * - "หน้าที่ ..." และข้อหน้าที่ "๑. ...": เยื้องเฉพาะบรรทัดแรก (แท็บ) บรรทัดถัดไปชิดขอบซ้าย เว้นก่อน/หลัง 6 พอยต์
 */
export type OrderParaKind = 'intro' | 'prose' | 'closing' | 'heading' | 'member' | 'duty' | 'dutyItem' | 'date' | 'break';
export interface OrderParaStyle { kind: OrderParaKind; firstLine: number; left: number; before: number; after: number; line: number }
const ORDER_INTRO_FIRST_LINE = 1106; // 16 วรรคของ TH SarabunIT๙ 16 พอยต์
export function orderParaStyles(texts: string[], headingIndent: number, dateIndent: number): OrderParaStyle[] {
  let seenList = false;
  let prose = 0;
  return texts.map(text => {
    const s = (kind: OrderParaKind, o: Partial<OrderParaStyle>): OrderParaStyle =>
      ({ kind, firstLine: 0, left: 0, before: 0, after: 0, line: 240, ...o });
    if (text === PAGE_BREAK_TEXT) return s('break', {});
    if (parseCommitteeRow(text).isMember) return s('member', { left: 1843 });
    if (/^[๐-๙0-9]+(?:\.[๐-๙0-9]+)*[\.\s]\s*คณะกรรมการ/.test(text)) {
      seenList = true;
      return s('heading', { left: headingIndent, before: 120, after: 120 });
    }
    if (text.startsWith('หน้าที่')) return s('duty', { firstLine: 1418, before: 120, after: 120 });
    if (/^[๐-๙0-9]+(?:\.[๐-๙0-9]+)*[\.\s]/.test(text)) return s('dutyItem', { firstLine: 1843, before: 120, after: 120 });
    if (text.startsWith('สั่ง ณ วันที่')) return s('date', { left: dateIndent, before: 120, after: 60 });
    if (seenList) return s('closing', { firstLine: 1418, before: 240, after: 160 });
    return prose++ === 0
      ? s('intro', { firstLine: ORDER_INTRO_FIRST_LINE, before: 120, after: 160, line: 259 })
      : s('prose', { firstLine: 1418, before: 120 });
  });
}

export function parseCommitteeRow(text: string) {
  const match = text.match(/^([๐-๙0-9]+(?:\.[๐-๙0-9]+)*[\.\s]\s*.+?)\s{2,}(.+)$/) ||
                text.match(/^([๐-๙0-9]+(?:\.[๐-๙0-9]+)*[\.\s]\s*.+?)\s*(ประธานกรรมการ|รองประธานกรรมการ|กรรมการและ(?:ผู้ช่วย)?เลขานุการ|ผู้ช่วยเลขานุการ|กรรมการ|ที่ปรึกษา)$/);
  if (match) {
    return { isMember: true, name: match[1].trim(), role: match[2].trim() };
  }
  return { isMember: false, name: text, role: '' };
}

export function parseAttachmentRow(text: string) {
  const numMatch = text.match(/^([๐-๙0-9]+(?:\.[๐-๙0-9]+)*[\.\s]\s*)(.*)$/);
  const core = numMatch ? numMatch[2].trim() : text.trim();
  const qtyMatch = core.match(/^(.*?)\s{2,}(.*?)$/) ||
                   core.match(/^(.*?)\s+(จำนวน\s+[๐-๙0-9]+\s*ฉบับ|\d+\s*ฉบับ|[๐-๙0-9]+\s*ชุด|จำนวน\s+[๐-๙0-9]+\s*ชุด)$/);
  if (qtyMatch) {
    return { item: qtyMatch[1].trim(), qty: qtyMatch[2].trim() };
  }
  return { item: core, qty: '' };
}

export function getCategoryDocPrefix(category = 'memo'): string {
  if (category === 'memo_circular') return 'อว 0646.02/ว ';
  if (category === 'memo') return 'อว 0646.02/';
  if (category === 'external_circular') return 'ที่ อว 0646.02/ว ';
  if (category === 'external') return 'ที่ อว 0646.02/';
  if (category === 'order') return 'ที่ ';
  return 'อว 0646.02/';
}

/**
 * Display formatted document number with permanent category prefix.
 * Trailing sequence number is appended when available.
 */
export function getDisplayDocNumber(r: Partial<AdminDocRegistryRecord>): string {
  const category = r.category || 'memo';
  const prefix = getCategoryDocPrefix(category);
  const raw = (r.docNumber || '').trim();

  // If order category
  if (category === 'order') {
    if (raw && !raw.startsWith('(')) {
      return raw.startsWith('ที่') ? raw : `ที่ ${raw}`;
    }
    const yearStr = r.year ? String(r.year) : (r.date ? String(Number(r.date.slice(0, 4)) + 543) : '๒๕๖๙');
    return `ที่      /${yearStr}`;
  }

  // If empty or placeholder like (รอออกเลข...)
  if (!raw || raw.startsWith('(')) {
    return prefix;
  }

  // If raw already contains slash or faculty code
  if (raw.includes('/') || raw.includes('อว')) {
    let clean = raw;
    if (category.startsWith('memo') && clean.startsWith('ที่')) {
      clean = clean.replace(/^ที่\s*/, '');
    }
    return clean;
  }

  // If raw is just sequence number e.g. "1741" or "๑๗๔๑"
  return `${prefix}${raw}`;
}

/**
 * HTML Preview and PDF printing template generator
 */
/**
 * ค่าปรับ Preview/PDF (Chrome) ให้ตรงกับไฟล์ Word ที่เปิดใน Microsoft Word (มม.)
 * วัดโดยพิมพ์ HTML เป็น PDF แล้วเทียบตำแหน่งทุกบรรทัดกับ PDF ที่ Word ส่งออกจากเอกสารเดียวกัน
 */
interface PreviewTune {
  /** บันทึกข้อความ: ความสูงแถบ "บันทึกข้อความ" และการขยับคำว่า "บันทึกข้อความ" ขึ้น/ลง */
  memoHeadMm?: number;
  memoTitleNudgeMm?: number;
  /** ขนาดคำว่า "บันทึกข้อความ" ตามต้นฉบับ (บันทึกข้อความ 28 พอยต์, (ว) 29 พอยต์) */
  memoTitlePt?: number;
  /** หนังสือภายนอก: ขยับทั้งหัวหนังสือ (ครุฑ + ที่/ที่อยู่) และตำแหน่งบรรทัดแรกของที่/ที่อยู่จากขอบบนครุฑ */
  extHeaderShiftMm?: number;
  extHeaderTextTopMm?: number;
  extDateGapMm?: number;
  /** คำสั่ง: ตำแหน่งครุฑและความสูงบล็อกครุฑ */
  orderGarudaTopMm?: number;
  orderHeaderBlockMm?: number;
  /** ระยะก่อนเนื้อหาย่อหน้าแรก */
  bodyGapMm: number;
  /** ปรับระยะก่อน "ขอแสดงความนับถือ" ชื่อผู้ลงนาม และผู้ประสานงาน เทียบกับค่าใน spec */
  closingAdjMm?: number;
  signAdjMm: number;
  coordinatorAdjMm?: number;
}
const PREVIEW_TUNE: Record<string, PreviewTune> = {
  memo: { memoHeadMm: 9.7, memoTitleNudgeMm: -0.15, memoTitlePt: 28, bodyGapMm: 2.2, signAdjMm: 0 },
  memo_circular: { memoHeadMm: 10.7, memoTitleNudgeMm: -0.45, memoTitlePt: 29, bodyGapMm: 2.2, signAdjMm: 0 },
  external: { extHeaderShiftMm: -3.5, extHeaderTextTopMm: 22.9, extDateGapMm: 1.6, bodyGapMm: 2.2, closingAdjMm: 0, signAdjMm: 0, coordinatorAdjMm: 0 },
  external_circular: { extHeaderShiftMm: 0, extHeaderTextTopMm: 21.9, extDateGapMm: 1.7, bodyGapMm: 1.8, closingAdjMm: 0, signAdjMm: 0, coordinatorAdjMm: 0 },
  order: { orderGarudaTopMm: -1.7, orderHeaderBlockMm: 29.0, bodyGapMm: -1.0, signAdjMm: 0 }
};

export function documentHtml(r: AdminDocRegistryRecord, origin: string, autoPrint = false) {
  const isMemo = r.category.startsWith('memo');
  const isOrder = r.category === 'order';
  const recipients = r.recipients?.filter(x => x.trim()) || [];
  const targets = (r.category === 'external_circular' || r.category === 'memo_circular') && recipients.length ? recipients : [r.to || ''];
  const digitType = getRecordDigitType(r);
  const displayDigits = (t: string) => formatDocDigits(t, digitType);

  const formattedSignatory = formatSignatoryName(r.signatoryName || r.signedByName || '');
  const signatoryPos = r.signatoryPosition || r.signedByPosition || '';
  const cleanSubject = sanitizeFieldText(r.subject, 'เรื่อง');
  const cleanReference = sanitizeFieldText(r.referenceDoc || '', 'อ้างถึง');
  const displayNum = getDisplayDocNumber(r);
  const formattedOrderNum = displayNum;

  const lineStyle = r.headerLineStyle || 'dot_leader';
  const lineVis = {
    govOrg: r.lineVisibility?.govOrg ?? true,
    docNumber: r.lineVisibility?.docNumber ?? true,
    docDate: r.lineVisibility?.docDate ?? true,
    subject: r.lineVisibility?.subject ?? true
  };

  // เส้นหัวบันทึกข้อความ: ประจุด (ค่าเริ่มต้น) หรือเส้นทึบ ตามที่ตั้งในเอกสาร
  const headerDash = lineStyle === 'solid' ? 'none' : '0.51 0.51';
  const uClass = (visible: boolean) => (visible && lineStyle !== 'none' ? 'mh-u' : '');
  // ช่องว่างหลังป้ายตามต้นฉบับ: ช่องว่างขนาด 11 พอยต์ (ขนาดเริ่มต้นของเอกสาร) บางช่องขีดเส้นใต้ด้วย
  const gap = (n: number) => `<span class="mh-gap">${' '.repeat(n)}</span>`;

  const bodyBlocks = getBodyBlocks(r);
  const bodyItems = isOrder ? orderItems(bodyBlocks) : bodyBlocks.map(b => ({ text: b.text, block: b }));
  const orderStyles = isOrder
    ? orderParaStyles(bodyItems.map(i => i.text), mmToTwips(getTemplateSpec('order').orderLayout!.headingIndentMm), mmToTwips(getTemplateSpec('order').orderLayout!.dateIndentMm))
    : [];
  const richRunsHtml = (b: RichBlock) =>
    b.runs.map(run => {
      let t = escape(displayDigits(run.text)).replace(/\n/g, '<br>');
      if (run.bold) t = `<strong>${t}</strong>`;
      if (run.italic) t = `<em>${t}</em>`;
      if (run.underline) t = `<u>${t}</u>`;
      return t;
    }).join('') || '&nbsp;';
  // บันทึกข้อความ: ย่อหน้า "จึงเรียน..." เว้นก่อน 12 พอยต์ (ประเภทอื่น 6 พอยต์) เหมือนไฟล์ Word
  const bodyParaHtml = (b: RichBlock) => b.pageBreak ? PAGE_BREAK_HTML :
    `<div class="body-para" style="${isMemo && b.text.startsWith('จึงเรียน') ? 'margin-top: 4.2mm; ' : ''}text-align: ${b.align};${b.firstLine ? '' : ' text-indent: 0;'}${b.indent ? ` margin-left: ${b.indent * INDENT_STEP_MM}mm;` : ''}">${richRunsHtml(b)}</div>`;
  const spec = getTemplateSpec(r.category);
  const letter = spec.letter;
  // รหัสท้ายหน้า CPRU-66-001 + เลขหน้า: ต้นฉบับมีเฉพาะบันทึกข้อความ (บันทึกข้อความ (ว) ไม่มีส่วนท้าย) เลขหน้าเป็นเลขอารบิกเสมอ
  const hasFooterCode = r.category === 'memo';
  const orderLayout = getTemplateSpec('order').orderLayout!;
  const pageMargin = cssMargin(spec.margins);
  const firstTopMm = spec.firstPageTop;
  // ระยะบรรทัดเดี่ยวของ Word กับ TH SarabunIT๙ (hhea 850+250+30 ต่อ 1000) วัดจริงได้ 6.4 มม. ต่อบรรทัด 16 พอยต์
  const WORD_LH = 1.134;
  const MEMO_GARUDA_TOP_MM = 10;
  // คำสั่งหน้า 2 ขึ้นไป: ตำแหน่งเนื้อหาบรรทัดแรกและเลขหน้าวัดจากไฟล์ Word (หัวกระดาษห่างขอบ 1.27 ซม.)
  const ORDER_NEXT_PAGE_TOP_MM = 24.6;
  const ORDER_PAGE_NO_TOP_MM = 12.7;
  // ตำแหน่งเส้นใต้: ระยะจากขอบล่างกล่องข้อความ 16 พอยต์ (วัดเทียบ Word)
  const MH_U_BOTTOM_MM = 1.05;
  // แท็บเติมจุดจบที่ตำแหน่งแท็บของต้นฉบับ (บันทึกข้อความ 9360 twips ไม่ชิดขอบขวา)
  const headerFillRightMm = (getPaper(r.category).mm.width - spec.margins.left - spec.margins.right - getHeaderFillTwips(r.category) / 56.693).toFixed(2);
  // ต้นฉบับบันทึกข้อความ (ว): วันที่ 15 พอยต์ และเรื่องบีบระยะตัวอักษร (w:spacing -6 ใน Word เท่ากับราว -0.21 พอยต์ต่อกลุ่มอักษรใน Chrome)
  const isMemoCircular = r.category === 'memo_circular';
  const tune = PREVIEW_TUNE[r.category] || PREVIEW_TUNE.memo;
  // หน้าเอกสารเปิดเป็น blob: ซึ่งหาไฟล์จากพาธ /... ไม่ได้ จึงต้องใส่โดเมนเต็มให้รูปครุฑและรูปลายเซ็น
  const absUrl = (u: string) => (/^\/(?!\/)/.test(u) ? origin + u : u);
  const garudaSrc = escape(absUrl(garudaPath(r.category)));
  const sign = spec.sign;
  // ระยะก่อนชื่อผู้ลงนาม (ไม่มีรูปลายเซ็น) ค่าเดียวกับ Word
  const signGapMm = (isOrder ? orderLayout.signGapMm : letter ? letter.signGapMm : sign.gapMm ?? 36.25) + tune.signAdjMm;
  // กล่องลงนามจัดกึ่งกลางในช่วงหลังเยื้อง เหมือนย่อหน้า Word ที่เยื้องซ้ายแล้วจัดกึ่งกลาง
  const signBox = `margin-left: ${sign.indentMm}mm;`;
  const closingBox = `margin-left: ${sign.closingIndentMm ?? sign.indentMm}mm;`;
  const sigBox = signaturePlacementMm(r.category, { width: SIGNATURE_BOX.maxWidthMm, height: SIGNATURE_BOX.maxHeightMm }, 'html'); // ตราครุฑบันทึกข้อความอยู่สูงจากขอบกระดาษ 1 ซม. ตามต้นฉบับ

  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>${escape(displayDigits(displayNum))} ${escape(cleanSubject.replace(/\s*\n\s*/g, ' '))}</title>
  <style>
    /* ฟอนต์เดียวกับไฟล์ Word ต้นฉบับ (TH SarabunIT๙) เพื่อให้ความกว้างตัวอักษรและการตัดบรรทัดตรงกับ Word */
    @font-face {
      font-family: 'THSarabunIT9';
      src: local('TH SarabunIT๙'), url('${escape(origin)}/templates/admin/fonts/THSarabunIT9-Regular.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: 'THSarabunIT9';
      src: local('TH SarabunIT๙ Bold'), url('${escape(origin)}/templates/admin/fonts/THSarabunIT9-Bold.ttf') format('truetype');
      font-weight: bold;
      font-style: normal;
    }
    @page {
      size: ${getPaper(r.category).cssSize};
      /* ระยะขอบตามต้นฉบับของประเภทเอกสาร ใช้กับทุกหน้า ไม่ใช่เฉพาะหน้าแรก */
      margin: ${pageMargin};
      ${hasFooterCode ? `
      @bottom-left { content: 'CPRU-66-001'; font-family: Calibri, Carlito, sans-serif; font-size: 11pt; vertical-align: top; margin-top: -0.9mm; line-height: 1; }
      @bottom-right { content: counter(page); font-family: Calibri, Carlito, sans-serif; font-size: 11pt; vertical-align: top; margin-top: -0.9mm; line-height: 1; }
      ` : ''}
    }
    article { page: doc; }
    @page doc { size: ${getPaper(r.category).cssSize}; margin: ${pageMargin}; }
    ${firstTopMm !== undefined ? `@page doc:first { margin-top: ${MEMO_GARUDA_TOP_MM}mm; }` : ''}
    ${isOrder ? `
    /* คำสั่ง: หน้า 2 เป็นต้นไปมีเลขหน้าเลขไทยมุมขวาบน (หัวกระดาษของไฟล์ Word) ซึ่งดันเนื้อหาลงเหมือนใน Word */
    @page doc {
      margin-top: ${ORDER_NEXT_PAGE_TOP_MM}mm;
      @top-right { content: counter(page, thai); font-family: 'THSarabunIT9', 'THSarabunPSK', sans-serif; font-size: 16pt; vertical-align: top; padding-top: ${ORDER_PAGE_NO_TOP_MM}mm; }
    }
    @page doc:first { margin-top: ${spec.margins.top}mm; @top-right { content: none; } }` : ''}
    html {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #000;
      background: #f1f5f9;
      font-family: 'THSarabunIT9', 'THSarabunPSK', 'Sarabun', sans-serif;
      font-size: 16pt;
      line-height: ${WORD_LH};
      -webkit-font-smoothing: antialiased;
    }
    .print-bar {
      text-align: center;
      padding: 12px;
      background: #0f172a;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    }
    .print-btn {
      background: #1e3a8a;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 8px 20px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      font-family: inherit;
    }
    .print-btn:hover { background: #1e40af; }
    .print-hint {
      display: inline-block;
      margin-left: 16px;
      color: #94a3b8;
      font-size: 12px;
      font-family: 'Sarabun', sans-serif;
      vertical-align: middle;
    }
    article {
      background: white;
      width: ${getPaper(r.category).mm.width}mm;
      min-height: ${getPaper(r.category).mm.height}mm;
      padding: ${firstTopMm !== undefined ? `${firstTopMm}mm ${spec.margins.right}mm ${spec.margins.bottom}mm ${spec.margins.left}mm` : pageMargin};
      margin: 20px auto;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      position: relative;
      overflow-wrap: break-word;
    }
    article + article { break-before: page; }
    .garuda-memo {
      position: absolute;
      left: 0;
      top: -${(firstTopMm ?? MEMO_GARUDA_TOP_MM) - MEMO_GARUDA_TOP_MM}mm;
      width: 14.9mm;
      height: 15.4mm;
      object-fit: contain;
    }
    .garuda-center, .garuda-ext, .garuda-memo { object-fit: fill !important; }
    .garuda-center {
      display: block;
      width: 28.5mm;
      height: 30mm;
      margin: 0 auto 3mm;
      object-fit: contain;
    }
    .ext-header {
      position: relative;
      margin-bottom: 0;
    }
    .ext-header-left {
      position: absolute;
      left: 0;
      top: 27mm;
      width: 60mm;
      font-size: 16pt;
      line-height: ${WORD_LH};
    }
    .ext-header-center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: 0;
      text-align: center;
      width: 32mm;
    }
    .garuda-ext {
      width: 28.5mm;
      height: 30mm;
      display: block;
      margin: 0 auto;
      object-fit: contain;
    }
    .ext-header-right {
      margin-left: 101.7mm;
      padding-top: 27mm;
      min-height: 30mm;
      font-size: 16pt;
      line-height: ${WORD_LH};
      white-space: pre-line;
      text-align: left;
    }
    .ext-date {
      margin: 4mm 0 2.5mm 75mm;
      font-size: 16pt;
      line-height: ${WORD_LH};
    }
    .ext-row {
      display: flex;
      margin: 2.1mm 0 0;
      line-height: ${WORD_LH};
      font-size: 16pt;
    }
    .ext-label {
      width: 12.5mm;
      font-size: 16pt;
      font-weight: normal;
      flex-shrink: 0;
    }
    .ext-closing {
      text-align: center;
      margin-bottom: 0;
      font-size: 16pt;
      line-height: ${WORD_LH};
    }
    .memohead {
      position: relative;
      height: ${tune.memoHeadMm ?? 12}mm;
      text-align: center;
      font-size: ${tune.memoTitlePt ?? 29}pt;
      font-weight: bold;
      line-height: ${tune.memoHeadMm ?? 12}mm;
      margin-bottom: 0;
    }
    /* แถวหัวบันทึกข้อความเลียนแบบย่อหน้าใน Word: ป้าย 20 พอยต์ ช่องว่างตามต้นฉบับ ค่าที่ขีดเส้นใต้
       เส้นคือขีดเส้นใต้แบบจุดของ Word (จุดดำ 0.51 มม. เว้น 0.51 มม. หนา 0.17 มม.) ใต้ข้อความทุกบรรทัดที่ตัดขึ้นใหม่
       และบรรทัดสุดท้ายต่อด้วยแท็บเติมจุดจนถึงตำแหน่งแท็บ สคริปต์ท้ายหน้าวาดเป็นเส้น SVG (เวกเตอร์ใน PDF) */
    .mh-row {
      position: relative;
      font-size: 16pt;
      line-height: ${WORD_LH};
      overflow-x: clip;
      white-space: pre-wrap;
    }
    .mh-label { font-size: 20pt; font-weight: bold; white-space: pre; }
    .mh-gap { font-size: 15pt; }
    .mh-line { position: absolute; overflow: visible; pointer-events: none; }
    .mh-split { display: flex; }
    .mh-split > .mh-row:first-child { width: 69.9mm; flex: none; }
    .mh-split > .mh-row:last-child { flex: 1; min-width: 0; }
    .memo-row {
      display: flex;
      padding: 0;
      line-height: ${WORD_LH};
      align-items: baseline;
    }
    .memo-label-regular {
      font-size: 16pt;
      font-weight: normal;
      margin-right: 0;
      width: 12.7mm;
      white-space: nowrap;
      flex-shrink: 0;
      color: #000;
    }
    .memo-val-line {
      flex: 1;
      display: flex;
      align-items: baseline;
      min-width: 0;
    }
    .val-text {
      font-size: 16pt;
      line-height: ${WORD_LH};
      white-space: pre-wrap;
    }
    .body-para {
      text-indent: 25mm;
      text-align: justify;
      text-justify: inter-character;
      margin: 2.1mm 0;
      line-height: ${WORD_LH};
    }
    .signature-container {
      text-align: center;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    /* กรอบลายเซ็นเท่ากับในไฟล์ Word: รูปย่อตามสัดส่วนให้พอดีกรอบ ชิดขอบล่างและกึ่งกลาง */
    .sig-img {
      position: absolute;
      width: ${SIGNATURE_BOX.maxWidthMm}mm;
      height: ${SIGNATURE_BOX.maxHeightMm}mm;
      object-fit: contain;
      object-position: center bottom;
    }
    .footer-memo {
      position: absolute;
      bottom: 15mm;
      left: 30mm;
      right: 20mm;
      display: flex;
      justify-content: space-between;
      font-family: Calibri, Carlito, sans-serif;
      font-size: 11pt;
      color: #000;
    }
    @media print {
      body { background: white; }
      .print-bar { display: none; }
      article {
        margin: 0;
        box-shadow: none;
        width: auto;
        min-height: 0;
        /* ระยะขอบมาตรฐานมาจาก @page แล้ว ห้ามใส่ padding ซ้ำ ไม่เช่นนั้นหน้าแรกจะขอบหนาเกินและเนื้อหาเลื่อน */
        padding: ${firstTopMm !== undefined ? `${firstTopMm - MEMO_GARUDA_TOP_MM}mm 0 0 0` : '0'};
      }
      .footer-memo { display: none; }
    }
  </style>
</head>
<body ${autoPrint ? 'onload="document.fonts.ready.then(function () { if (window.placeHeaderFills) window.placeHeaderFills(); window.print(); });"' : ''}>
  ${!autoPrint ? `
  <div class="print-bar">
    <button class="print-btn" onclick="window.print();">พิมพ์เอกสาร / บันทึกเป็น PDF</button>
    <span class="print-hint">หากต้องการซ่อนวันที่/URL ที่ขอบกระดาษ: ในหน้าต่างพิมพ์ ให้ยกเลิก "ส่วนหัวและส่วนท้าย" (Headers and Footers)</span>
  </div>
  ` : ''}

  ${targets.map((targetTo, targetIdx) => `
  <article>
    ${isMemo ? `
      <div class="memohead">
        <img class="garuda-memo" src="${garudaSrc}" alt="ครุฑ" />
        <span style="position: relative; top: ${tune.memoTitleNudgeMm ?? 0}mm;">บันทึกข้อความ</span>
      </div>

      <div data-mh-dash="${headerDash}" style="margin-right: ${headerFillRightMm}mm;">
        <div class="mh-row"><span class="mh-label">ส่วนราชการ</span><span class="${uClass(lineVis.govOrg)}">${gap(2)}${escape(displayDigits((r.from || '').trim()))}</span></div>
        <div class="mh-split">
          <div class="mh-row"><span class="mh-label">ที่</span>${gap(isMemoCircular ? 1 : 2)}<span class="${uClass(lineVis.docNumber)}">${escape(displayDigits(displayNum.trim()))}</span></div>
          <div class="mh-row"><span class="mh-label">วันที่</span><span class="${uClass(lineVis.docDate)}">${gap(isMemoCircular ? 2 : 1)}<span style="font-size: 15pt;"> ${isMemoCircular ? '' : '</span><span>'}${escape(thaiGovDate(r.date, digitType, 'memo'))}</span></span></div>
        </div>
        ${isMemoCircular
          ? `<div class="mh-row"><span class="mh-label">เรื่อง  </span><span class="${uClass(lineVis.subject)}" style="letter-spacing: -0.21pt;">${escape(displayDigits(cleanSubject.trim()))}</span></div>`
          : `<div class="mh-row" style="padding-left: 12.5mm; text-indent: -12.5mm;"><span class="mh-label" style="display: inline-block; width: 12.5mm; text-indent: 0;">เรื่อง</span><span class="${uClass(lineVis.subject)}">${escape(displayDigits(cleanSubject.trim()))}</span></div>`}
      </div>

      <div class="memo-row" style="margin-top: 2.1mm;">
        <span class="memo-label-regular">เรียน</span>
        <div class="memo-val-line">
          <span class="val-text">${escape(displayDigits(targetTo || r.to))}</span>
        </div>
      </div>
    ` : isOrder ? `
      <img class="garuda-center" style="width: ${orderLayout.garuda.widthMm}mm; height: ${orderLayout.garuda.heightMm}mm; margin: ${tune.orderGarudaTopMm ?? orderLayout.garuda.topOffsetMm}mm auto ${((tune.orderHeaderBlockMm ?? orderLayout.headerBlockMm) - orderLayout.garuda.heightMm - (tune.orderGarudaTopMm ?? orderLayout.garuda.topOffsetMm)).toFixed(1)}mm;" src="${garudaSrc}" alt="ครุฑ" />
      <div style="text-align: center; font-weight: bold; font-size: 16pt; line-height: ${WORD_LH}; margin-bottom: 3mm;">
        <div>คำสั่ง${escape(displayDigits((r.from || '').trim().replace(/^คำสั่ง\s*/, '')))}</div>
        <div>${escape(displayDigits(formattedOrderNum))}</div>
        ${cleanSubject.split('\n').map((line, i) => i === 0
          ? `<div style="padding-left: 25mm; text-indent: -25mm; white-space: pre-wrap;">เรื่อง  ${escape(displayDigits(line))}</div>`
          : `<div>${escape(displayDigits(line))}</div>`).join('')}
        <div style="font-size: 16pt;">........................................................</div>
      </div>
    ` : `
      <div class="ext-header" style="margin-top: ${tune.extHeaderShiftMm ?? 0}mm;">
        <div class="ext-header-left" style="top: ${tune.extHeaderTextTopMm ?? letter?.headerTextTopMm ?? 27}mm;">
          ${escape(displayDigits(displayNum))}
        </div>
        <div class="ext-header-center" ${letter ? `style="left: ${letter.garuda.leftMm}mm; transform: none; width: ${letter.garuda.widthMm}mm;"` : ''}>
          <img class="garuda-ext" ${letter ? `style="width: ${letter.garuda.widthMm}mm; height: ${letter.garuda.heightMm}mm;"` : ''} src="${garudaSrc}" alt="ครุฑ" />
        </div>
        <div class="ext-header-right" style="padding-top: ${tune.extHeaderTextTopMm ?? letter?.headerTextTopMm ?? 27}mm;">${escape(displayDigits(r.officeAddress || r.from))}</div>
      </div>
      <div class="ext-date" style="margin-top: ${tune.extDateGapMm ?? 4}mm;">
        ${escape(thaiGovDate(r.date, digitType, 'external'))}
      </div>
      <div class="ext-row"><b class="ext-label">เรื่อง</b><span>${lines(displayDigits(cleanSubject))}</span></div>
      <div class="ext-row"><b class="ext-label">เรียน</b><span>${escape(displayDigits(targetTo || r.to))}</span></div>
    `}

    ${cleanReference ? `
      <div class="ext-row"><b class="ext-label">อ้างถึง</b><span>${escape(displayDigits(cleanReference))}</span></div>
    ` : ''}

    ${(r.attachmentsList || []).length > 0 ? `
      <div style="margin: 0;">
        ${(r.attachmentsList || []).map((att, i) => {
          const parsed = parseAttachmentRow(att);
          return `<div class="ext-row" style="justify-content: space-between;${i > 0 || !isMemo ? ' margin-top: 0;' : ''}">
            <div style="display: flex;">
              <b class="ext-label" style="width: 25mm;">${i === 0 ? 'สิ่งที่ส่งมาด้วย' : ''}</b>
              <span>${displayDigits(String(i + 1))}. ${escape(displayDigits(parsed.item))}</span>
            </div>
            ${parsed.qty ? `<span style="text-align: right; margin-right: 10mm;">${escape(displayDigits(parsed.qty))}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
    ` : ''}

    <div style="margin-top: ${tune.bodyGapMm}mm;">
      ${bodyItems.map(({ text: p, block }, k) => {
        if (isOrder) {
          // ระยะและการเยื้องชุดเดียวกับไฟล์ Word (orderParaStyles) margin ของ HTML ยุบรวมแบบเดียวกับ Word
          const st = orderStyles[k];
          const tw = (v: number) => (v / 56.693).toFixed(2);
          const box = `margin: ${tw(st.before)}mm 0 ${tw(st.after)}mm; padding-left: ${tw(st.left)}mm; text-indent: ${tw(st.firstLine)}mm; line-height: ${(WORD_LH * st.line / 240).toFixed(4)};`;
          if (st.kind === 'break') return PAGE_BREAK_HTML;
          if (st.kind === 'member') {
            const mem = parseCommitteeRow(p);
            return `<div style="display: flex; ${box}">
              <span style="width: 81.5mm; flex-shrink: 0;">${escape(displayDigits(mem.name))}</span>
              <span>${escape(displayDigits(mem.role))}</span>
            </div>`;
          }
          if (st.kind === 'heading') return `<div style="${box} font-weight: bold;">${escape(displayDigits(p))}</div>`;
          if (st.kind === 'duty') {
            // ตัวหนาเฉพาะคำว่า "หน้าที่" ข้อความต่อท้ายเป็นตัวปกติ ตามต้นฉบับ
            return `<div style="${box} text-align: justify; text-justify: inter-character;"><strong>${escape(displayDigits('หน้าที่'))}</strong>${escape(displayDigits(p.slice('หน้าที่'.length)))}</div>`;
          }
          if (st.kind === 'dutyItem') return `<div style="${box} text-align: justify; text-justify: inter-character;">${escape(displayDigits(p))}</div>`;
          if (st.kind === 'date') return `<div style="${box}">${escape(displayDigits(p))}</div>`;
          return `<div class="body-para" style="${box}${block.firstLine ? '' : ' text-indent: 0;'} text-align: ${block.align};">${richRunsHtml(block)}</div>`;
        }
        return bodyParaHtml(block);
      }).join('')}
      ${isOrder && !bodyItems.some(i => i.text.startsWith('สั่ง ณ วันที่')) ? `
        <div style="padding-left: ${orderLayout.dateIndentMm}mm; margin: 2.12mm 0 1.06mm; line-height: ${WORD_LH};">
          ${escape(displayDigits(thaiGovDate(r.date, digitType, 'order')))}
        </div>
      ` : ''}
    </div>

    ${!isMemo && !isOrder ? `<div class="ext-closing" style="${closingBox} margin-top: ${((letter?.closingGapMm ?? 4.2) + (tune.closingAdjMm ?? 0)).toFixed(1)}mm;">ขอแสดงความนับถือ</div>` : ''}

    <!-- ระยะก่อนชื่อตามแม่แบบเสมอ รูปลายเซ็นลอยเหนือชื่อ (กรอบ 4 x 1.5 ซม. ย่อตามสัดส่วน ชิดล่างกึ่งกลาง) ไม่ดันข้อความ เหมือนไฟล์ Word -->
    <div class="signature-container" style="${signBox} margin-top: ${signGapMm.toFixed(1)}mm;">
      <p style="position: relative; font-size: 16pt; font-weight: normal; margin: 0; line-height: ${WORD_LH}; color: #000;">${r.signatureUrl ? `<img class="sig-img" style="left: ${(sigBox.left - sign.indentMm).toFixed(2)}mm; top: ${sigBox.top.toFixed(2)}mm;" src="${escape(absUrl(r.signatureUrl))}" alt="ลายเซ็น" />` : ''}(${escape(displayDigits(formattedSignatory))})</p>
      <p style="font-size: 16pt; font-weight: normal; margin: ${sign.positionGapMm ?? 0}mm 0 0; white-space: pre-line; line-height: ${WORD_LH}; color: #000;">${escape(displayDigits(signatoryPos))}</p>
    </div>

    ${r.coordinatorInfo ? `
      <div style="margin-top: ${(letter ? letter.coordinatorGapMm + (tune.coordinatorAdjMm ?? 0) : 4.2).toFixed(1)}mm; font-size: 16pt; line-height: ${WORD_LH}; white-space: pre-line;">${escape(displayDigits(r.coordinatorInfo))}</div>
    ` : ''}

    ${hasFooterCode ? `
      <div class="footer-memo">
        <span>CPRU-66-001</span>
        <span>${targetIdx + 1}</span>
      </div>
    ` : ''}
  </article>
  `).join('')}
  <script>
    // เส้นหัวบันทึกข้อความแบบ Word: ใต้ข้อความทุกบรรทัด และบรรทัดสุดท้ายต่อแท็บเติมจุดจนถึงขอบแถว (ตำแหน่งแท็บ)
    // หน่วย มม. แปลงเป็น px (96 dpi) ความสูงอิงขอบล่างกล่องข้อความ ${MH_U_BOTTOM_MM} มม. เส้นหนา 0.17 มม.
    window.placeHeaderFills = function () {
      var MM = 96 / 25.4, NS = 'http://www.w3.org/2000/svg';
      document.querySelectorAll('.mh-line').forEach(function (e) { e.remove(); });
      document.querySelectorAll('.mh-u').forEach(function (u) {
        var row = u.closest('.mh-row');
        var box = u.closest('[data-mh-dash]');
        var rects = u.getClientRects();
        if (!row || !rects.length) return;
        var dash = box ? box.getAttribute('data-mh-dash') : '0.51 0.51';
        var rr = row.getBoundingClientRect();
        for (var i = 0; i < rects.length; i++) {
          var r = rects[i];
          var x0 = r.left - rr.left;
          var x1 = i === rects.length - 1 ? rr.width : r.right - rr.left;
          var y = r.bottom - rr.top - (${MH_U_BOTTOM_MM} + 0.085) * MM;
          var svg = document.createElementNS(NS, 'svg');
          svg.setAttribute('class', 'mh-line');
          svg.setAttribute('width', String(Math.max(0, x1 - x0)));
          svg.setAttribute('height', String(MM));
          svg.style.left = x0 + 'px';
          svg.style.top = (y - MM / 2) + 'px';
          var line = document.createElementNS(NS, 'line');
          line.setAttribute('x1', '0');
          line.setAttribute('x2', String(Math.max(0, x1 - x0)));
          line.setAttribute('y1', String(MM / 2));
          line.setAttribute('y2', String(MM / 2));
          line.setAttribute('stroke', '#000');
          line.setAttribute('stroke-width', String(0.17 * MM));
          if (dash !== 'none') line.setAttribute('stroke-dasharray', dash.split(' ').map(function (v) { return String(Number(v) * MM); }).join(' '));
          svg.appendChild(line);
          row.appendChild(svg);
        }
      });
    };
    document.fonts.ready.then(window.placeHeaderFills);
    window.addEventListener('resize', window.placeHeaderFills);
  </script>
</body>
</html>`;
}

export function openDocument(r: AdminDocRegistryRecord, autoPrint = false) {
  const html = documentHtml(r, window.location.origin, autoPrint);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const preview = window.open(url, '_blank');
  if (!preview) {
    URL.revokeObjectURL(url);
    throw new Error('กรุณาอนุญาตหน้าต่างใหม่ (Pop-up) เพื่อดูและพิมพ์เอกสาร');
  }
  // คืน memory หลังจากหน้าต่างโหลดเสร็จ
  preview.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
}

export function exportAdminPdf(r: AdminDocRegistryRecord) {
  openDocument(r, true);
}

/**
 * High-fidelity Word (.docx) builder
 */
/** โหลดรูปลายเซ็น (data URI หรือ URL) เป็นไบต์ สำหรับฝังในแม่แบบ */
async function loadSignatureImage(url: string): Promise<{ bytes: Uint8Array; ext: 'png' | 'jpg' } | null> {
  try {
    if (url.startsWith('data:image/')) {
      const ext = /^data:image\/jpe?g/i.test(url) ? 'jpg' : 'png';
      const bin = atob(url.split(',')[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return { bytes, ext };
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    return { bytes: new Uint8Array(await res.arrayBuffer()), ext: /\.jpe?g(\?|$)/i.test(url) ? 'jpg' : 'png' };
  } catch {
    return null;
  }
}

/**
 * ส่งออก Word จากไฟล์แม่แบบต้นฉบับของคณะ (public/templates/admin/word/<ประเภท>.docx)
 * ส่วนหัว ตราครุฑ ท้ายกระดาษ ฟอนต์ และหน้ากระดาษมาจากไฟล์ต้นฉบับโดยตรง ระบบแทนเฉพาะค่าและเนื้อหา
 * ผู้รับหลายรายของหนังสือเวียน = หลายฉบับในไฟล์เดียว คืน null เมื่อโหลดแม่แบบไม่ได้ให้ใช้ตัวสร้างเดิมแทน
 */
async function buildFromTemplate(r: AdminDocRegistryRecord): Promise<Blob | null> {
  const template = await loadWordTemplate(r.category);
  if (!template) return null;
  try {
    const digitType = getRecordDigitType(r);
    const display = (t: string) => formatDocDigits(t, digitType);
    const isMemo = r.category === 'memo' || r.category === 'memo_circular';
    const isOrder = r.category === 'order';
    const isCircular = r.category === 'memo_circular' || r.category === 'external_circular';
    const recipients = (r.recipients || []).filter(x => x.trim());
    const targets = isCircular && recipients.length ? recipients : [r.to || ''];
    const letter = getTemplateSpec(r.category).letter;
    const orderLayout = getTemplateSpec('order').orderLayout!;
    const reference = sanitizeFieldText(r.referenceDoc || '', 'อ้างถึง');
    const subject = sanitizeFieldText(r.subject, 'เรื่อง');
    const docNumber = getDisplayDocNumber(r);
    const signatory = formatSignatoryName(r.signatoryName || r.signedByName || '');
    const position = r.signatoryPosition || r.signedByPosition || '';
    const blocks = getBodyBlocks(r);

    const images: TemplateImage[] = [];
    if (r.signatureUrl) {
      const img = await loadSignatureImage(r.signatureUrl);
      if (img) images.push({ rId: 'rIdSignature1', ...img });
    }

    const labelLine = (label: string, text: string, indent: number) =>
      xmlPara(xmlRun(label) + xmlTab() + xmlRun(display(text)), { left: indent, hanging: indent, tabs: [indent], before: 120 });
    const attachments = (r.attachmentsList || []).map((att, i) => {
      if (isMemo) return labelLine(i === 0 ? 'สิ่งที่ส่งมาด้วย' : '', `${i + 1}. ${att}`, 1417);
      const parsed = parseAttachmentRow(att);
      const numText = `${display(String(i + 1))}. ${display(parsed.item)}`;
      return parsed.qty
        ? xmlPara(xmlRun(i === 0 ? 'สิ่งที่ส่งมาด้วย' : '') + xmlTab() + xmlRun(numText) + xmlTab() + xmlRun(display(parsed.qty)), { left: 1417, hanging: 1417, tabs: [1417, 7200] })
        : labelLine(i === 0 ? 'สิ่งที่ส่งมาด้วย' : '', numText, 1417);
    });

    // บล็อกลงนาม: ตำแหน่งและระยะห่างตามต้นฉบับของแต่ละประเภท (spec.sign) มีรูปลายเซ็นจะเว้นเท่ารูป
    const sign = getTemplateSpec(r.category).sign;
    const signIndent = mmToTwips(sign.indentMm);
    const closingIndent = mmToTwips(sign.closingIndentMm ?? sign.indentMm);
    const signGap = isOrder ? orderLayout.signGapMm : letter ? letter.signGapMm : sign.gapMm ?? 36.25;
    // ลายเซ็นลอยเหนือชื่อ ไม่ดันข้อความ ระยะและตำแหน่งชื่อคงตามแม่แบบเสมอ
    const sigSize = images.length ? fitSignatureMm(imagePixelSize(images[0].bytes)) : null;
    const sigPos = sigSize ? signaturePlacementMm(r.category, sigSize, 'word', signGap) : null;
    const signatureXml = () =>
      xmlPara((sigSize && sigPos ? xmlFloatingImageRun('rIdSignature1', sigSize.width, sigSize.height, sigPos.left, sigPos.top) : '') + xmlRun(`(${display(signatory)})`), {
        align: 'center',
        left: signIndent,
        before: mmToTwips(signGap),
        keepNext: true
      }) +
      xmlPara(xmlRun(display(position)), { align: 'center', left: signIndent, before: mmToTwips(sign.positionGapMm ?? 0) });
    const coordinatorXml = (gapMm?: number) =>
      r.coordinatorInfo ? xmlPara(xmlRun(display(r.coordinatorInfo)), { before: gapMm ? Math.round(gapMm * 56.693) : 240 }) : '';

    const data: Record<string, unknown> = {};
    if (isMemo) {
      Object.assign(data, {
        from: display(r.from || ''),
        docNumber: display(docNumber),
        date: thaiGovDate(r.date, digitType, 'memo'),
        subject: display(subject)
      });
    }

    data.letters = targets.map((to, index) => {
      const last = index === targets.length - 1;
      const pageBreak = last ? '' : PAGE_BREAK_XML;
      if (isMemo) {
        return {
          to: display(to),
          extra: (reference ? labelLine('อ้างถึง', reference, 720) : '') + attachments.join(''),
          body: blocksToWordXml(blocks, display, b => (b.text.startsWith('จึงเรียน') ? 240 : 120)),
          signature: signatureXml(),
          coordinator: coordinatorXml(),
          notLast: !last
        };
      }
      if (isOrder) {
        const centered = (text: string, extra: XmlParaOptions = {}) => xmlPara(xmlRun(text, { bold: true }), { align: 'center', ...extra });
        const headingIndent = Math.round(orderLayout.headingIndentMm * 56.693);
        const dateIndent = Math.round(orderLayout.dateIndentMm * 56.693);
        const items = orderItems(blocks);
        const parts: string[] = [
          centered('คำสั่ง' + display((r.from || '').trim().replace(/^คำสั่ง\s*/, ''))),
          centered(display(docNumber)),
          // บรรทัดที่ผู้ร่างขึ้นใหม่เองเป็นย่อหน้ากึ่งกลางเต็มบรรทัด เหมือนต้นฉบับ (บรรทัดที่ตัดอัตโนมัติยังเยื้องแบบแขวน)
          ...subject.split('\n').map((line, i) =>
            i === 0 ? centered('เรื่อง  ' + display(line), { left: 1418, hanging: 1418 }) : centered(display(line))),
          centered('........................................................', { after: 120 })
        ];
        const styles = orderParaStyles(items.map(i => i.text), headingIndent, dateIndent);
        items.forEach(({ text, block }, k) => {
          const st = styles[k];
          const pos = { firstLine: st.firstLine, left: st.left, before: st.before, after: st.after, line: st.line };
          if (st.kind === 'break') {
            parts.push(PAGE_BREAK_BLOCK_XML);
          } else if (st.kind === 'member') {
            const mem = parseCommitteeRow(text);
            parts.push(xmlPara(xmlRun(display(mem.name)) + xmlTab() + xmlRun(display(mem.role)), { ...pos, tabs: [6460] }));
          } else if (st.kind === 'heading') {
            parts.push(xmlPara(xmlRun(display(text), { bold: true }), { ...pos, keepNext: true }));
          } else if (st.kind === 'duty') {
            const rest = text.slice('หน้าที่'.length);
            parts.push(xmlPara(xmlRun('หน้าที่', { bold: true }) + (rest.trim() ? xmlRun(display(rest)) : ''), { ...pos, align: 'distribute', keepNext: !rest.trim() }));
          } else if (st.kind === 'dutyItem') {
            parts.push(xmlPara(xmlRun(display(text)), { ...pos, align: 'distribute' }));
          } else if (st.kind === 'date') {
            parts.push(xmlPara(xmlRun(display(text)), { ...pos, keepNext: true }));
          } else {
            // ย่อหน้าข้อความ: คงรูปแบบที่ผู้ร่างตั้ง (ตัวหนา/จัดแนว/ปิดเยื้องบรรทัดแรก) ระยะตามต้นฉบับ
            parts.push(blocksToWordXml([block], display, () => st.before, b => ({ firstLine: b.firstLine ? st.firstLine : 0, after: st.after, line: st.line })));
          }
        });
        if (!items.some(i => i.text.startsWith('สั่ง ณ วันที่'))) {
          parts.push(xmlPara(xmlRun(display(thaiGovDate(r.date, digitType, 'order'))), { left: dateIndent, before: 120, after: 60, keepNext: true }));
        }
        parts.push(signatureXml(), coordinatorXml());
        return { content: parts.join(''), pageBreak };
      }
      // หนังสือภายนอก / หนังสือภายนอก (ว)
      const addr = (r.officeAddress || r.from || '').split('\n').map(x => x.trim()).filter(Boolean);
      const parts: string[] = [
        xmlPara(xmlRun(display(docNumber)) + xmlTab() + xmlRun(display(addr[0] || '')), { tabs: [5760] }),
        ...addr.slice(1).map(l => xmlPara(xmlRun(display(l)), { left: 5760 })),
        xmlPara(xmlRun(thaiGovDate(r.date, digitType, 'external')), { left: 4252, before: 120, after: 120 }),
        labelLine('เรื่อง', subject, 720),
        labelLine('เรียน', to, 720),
        ...(reference ? [labelLine('อ้างถึง', reference, 720)] : []),
        ...attachments,
        blocksToWordXml(blocks, display),
        xmlPara(xmlRun('ขอแสดงความนับถือ'), { align: 'center', left: closingIndent, before: letter ? Math.round(letter.closingGapMm * 56.693) : 240, after: 60, keepNext: true }),
        signatureXml(),
        coordinatorXml(letter?.coordinatorGapMm)
      ];
      return { content: parts.join(''), pageBreak };
    });

    return await renderWordTemplate(template, data, images);
  } catch (err) {
    console.warn('แม่แบบ Word ใช้งานไม่ได้ ใช้ตัวสร้างเดิมแทน:', err);
    return null;
  }
}

export async function buildAdminWord(r: AdminDocRegistryRecord): Promise<Blob> {
  if (r.action === 'รอลงนาม') {
    throw new Error('เอกสารอยู่ในขั้นตอน "รอลงนาม" ไม่อนุญาตให้ดาวน์โหลดไฟล์ Word เพื่อป้องกันการแก้ไขก่อนลงนาม');
  }

  const fromTemplate = await buildFromTemplate(r);
  if (fromTemplate) return fromTemplate;

  const {
    Document, Paragraph, TextRun, ImageRun, Packer, AlignmentType, Table, TableRow, TableCell,
    BorderStyle, WidthType, LineRuleType, PageBreak, VerticalAlign, TabStopType, UnderlineType,
    Footer, Header, PageNumber, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType, HorizontalPositionAlign
  } = await import('docx');

  // Load garuda image
  let garudaBytes: ArrayBuffer | null = null;
  try {
    const rawPath = garudaPath(r.category);
    if (typeof window !== 'undefined') {
      const res = await fetch(rawPath);
      if (res.ok) garudaBytes = await res.arrayBuffer();
    } else {
      // In Node.js testing/CLI environment
      const fs = await import('fs');
      const path = await import('path');
      const localFile = path.join(process.cwd(), 'public', rawPath.replace(/^\//, ''));
      if (fs.existsSync(localFile)) {
        const buf = fs.readFileSync(localFile);
        garudaBytes = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      }
    }
  } catch (err) {
    // Graceful fallback if image is not accessible
  }

  // Load signature image if present
  let signatureBytes: ArrayBuffer | null = null;
  if (r.signatureUrl) {
    try {
      if (r.signatureUrl.startsWith('data:image/')) {
        const base64Data = r.signatureUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        signatureBytes = bytes.buffer;
      } else {
        const res = await fetch(r.signatureUrl);
        if (res.ok) signatureBytes = await res.arrayBuffer();
      }
    } catch (err) {
      console.warn('Signature image load warning in Word export:', err);
    }
  }

  // ต้นฉบับใช้ระยะบรรทัดเดี่ยว (line=240 auto) ไม่ใช่ exact เพื่อให้ตัดบรรทัดและเว้นระยะเหมือน Word จริง
  const docStyles = { default: { document: { run: { font: { ascii: 'TH SarabunPSK', hAnsi: 'TH SarabunPSK', cs: 'TH SarabunPSK', eastAsia: 'TH SarabunPSK' }, size: 32, sizeComplexScript: 32 } } } };
  const SINGLE = { line: 240, lineRule: LineRuleType.AUTO } as const;
  const font = 'TH SarabunPSK';
  const digitType = getRecordDigitType(r);
  const display = (text: string) => formatDocDigits(text, digitType);
  const formattedSignatory = formatSignatoryName(r.signatoryName || r.signedByName || '');
  const signatoryPos = r.signatoryPosition || r.signedByPosition || '';
  const cleanSubject = sanitizeFieldText(r.subject, 'เรื่อง');
  const cleanReference = sanitizeFieldText(r.referenceDoc || '', 'อ้างถึง');
  const displayNum = getDisplayDocNumber(r);
  const isMemo = r.category.startsWith('memo');
  const isOrder = r.category === 'order';
  // บล็อกลงนามตามต้นฉบับของแต่ละประเภท (spec.sign) ชุดเดียวกับแม่แบบ Word
  const letterSpec = getTemplateSpec(r.category).letter;
  const orderLayout = getTemplateSpec('order').orderLayout!;
  const signSpec = getTemplateSpec(r.category).sign;
  const sigIndent = mmToTwips(signSpec.indentMm);
  const closingIndent = mmToTwips(signSpec.closingIndentMm ?? signSpec.indentMm);
  const formattedOrderNum = displayNum;
  const pageWidth = getPaper(r.category).twips.width;
  const pageHeight = getPaper(r.category).twips.height;
  const pageMargins = wordMargin(getTemplateSpec(r.category).margins);
  const border = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

  const recipients = r.recipients?.filter(x => x.trim()) || [];
  const targets = (r.category === 'external_circular' || r.category === 'memo_circular') && recipients.length ? recipients : [r.to || ''];

  const run = (text: string, bold = false, size = 32) =>
    new TextRun({
      text: display(text),
      font,
      size,
      bold,
      sizeComplexScript: size,
      language: { value: 'th-TH' }
    });

  const para = (text: string, opts: Record<string, unknown> = {}) =>
    new Paragraph({
      children: text.split('\n').flatMap((line, i) => [
        ...(i ? [new TextRun({ break: 1, font, size: 32, language: { value: 'th-TH' } })] : []),
        run(line)
      ]),
      spacing: { ...SINGLE, after: 0 },
      ...opts
    });

  const alignMap = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.THAI_DISTRIBUTE
  } as const;

  const blockRuns = (b: RichBlock) => {
    const runs = b.runs.flatMap(rr => rr.text.split('\n').flatMap((line, i) => [
      ...(i ? [new TextRun({ break: 1, font, size: 32, language: { value: 'th-TH' } })] : []),
      ...(line ? [new TextRun({
        text: display(line),
        font,
        size: 32,
        sizeComplexScript: 32,
        bold: rr.bold,
        italics: rr.italic,
        underline: rr.underline ? { type: UnderlineType.SINGLE } : undefined,
        language: { value: 'th-TH' }
      })] : [])
    ]));
    return runs.length ? runs : [new TextRun({ text: '', font, size: 32 })];
  };

  const body = (b: RichBlock, spacing: Record<string, unknown> = { ...SINGLE, before: 120, after: 0 }) =>
    b.pageBreak ? [new Paragraph({ children: [new PageBreak()] }), para(' ')] : new Paragraph({
      children: blockRuns(b),
      alignment: alignMap[b.align],
      indent: { firstLine: b.firstLine ? 1417 : 0, left: b.indent * INDENT_STEP_TWIPS }, // 2.5 cm
      spacing
    });

  // Signature block: ลายเซ็นลอยเหนือชื่อ ระยะตามแม่แบบเสมอ (ชุดเดียวกับแม่แบบ Word)
  const sigSize = signatureBytes ? fitSignatureMm(imagePixelSize(new Uint8Array(signatureBytes))) : null;
  const sigSpaceBeforeMm = isOrder ? orderLayout.signGapMm : letterSpec ? letterSpec.signGapMm : signSpec.gapMm ?? 36.25;
  const sigPos = sigSize ? signaturePlacementMm(r.category, sigSize, 'word', sigSpaceBeforeMm) : null;
  const signatureParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      indent: { left: sigIndent },
      keepNext: true,
      spacing: { before: isOrder ? mmToTwips(orderLayout.signGapMm) : letterSpec ? mmToTwips(letterSpec.signGapMm) : mmToTwips(signSpec.gapMm ?? 36.25), after: 0, ...SINGLE },
      children: [
        ...(signatureBytes && sigSize && sigPos ? [new ImageRun({
          type: 'png',
          data: signatureBytes,
          transformation: { width: Math.round(sigSize.width * 96 / 25.4), height: Math.round(sigSize.height * 96 / 25.4) },
          floating: {
            horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, offset: Math.round(sigPos.left * 36000) },
            verticalPosition: { relative: VerticalPositionRelativeFrom.LINE, offset: Math.round(sigPos.top * 36000) },
            wrap: { type: TextWrappingType.NONE },
            allowOverlap: true,
            behindDocument: false
          }
        })] : []),
        run('(' + formattedSignatory + ')')
      ]
    }),
    para(signatoryPos.replace(/\s*ปฏิบัติราชการแทน\s*/, ' ปฏิบัติราชการแทน\n').replace(/\s*รักษาราชการแทน\s*/, ' รักษาราชการแทน\n'), {
      alignment: AlignmentType.CENTER,
      indent: { left: sigIndent },
      keepLines: true,
      spacing: { ...SINGLE, before: mmToTwips(signSpec.positionGapMm ?? 0), after: 0 }
    })
  ];

  if (isMemo) {
    const dotted = { style: BorderStyle.DOTTED, size: 4, color: '000000' };
    const solid = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
    const lineBorder = r.headerLineStyle === 'solid' ? solid : r.headerLineStyle === 'none' ? undefined : dotted;

    // ช่องว่างหลังป้ายหัวข้อตามต้นฉบับ: ส่วนราชการ/ที่/วันที่ เคาะ 2 ครั้งขนาดเล็ก (ต้นฉบับใช้ 11 พอยต์
    // ตามฟอนต์เริ่มต้นของเอกสาร) ส่วนเรื่องใช้แท็บไปที่ 1.27 ซม.
    const field = (label: string, value: string, applyBorder = false, isHalfCell = false, gap: 'spaces' | 'tab' = 'spaces') => {
      const underlineStyle = applyBorder && r.headerLineStyle !== 'none'
        ? { type: r.headerLineStyle === 'solid' ? UnderlineType.SINGLE : UnderlineType.DOTTED }
        : undefined;

      return new Paragraph({
        children: [
          new TextRun({ text: label, font, size: 40, bold: true, sizeComplexScript: 40, language: { value: 'th-TH' } }),
          gap === 'tab'
            ? new TextRun({ text: '\t', font, size: 40, bold: true, language: { value: 'th-TH' } })
            : new TextRun({ text: '  ', font, size: 22, sizeComplexScript: 22, language: { value: 'th-TH' } }),
          new TextRun({ text: display(value), font, size: 32, sizeComplexScript: 32, language: { value: 'th-TH' }, underline: underlineStyle }),
          ...(underlineStyle ? [
            new TextRun({ text: '\t', font, size: 32, underline: underlineStyle })
          ] : [])
        ],
        tabStops: [
          ...(gap === 'tab' ? [{ type: TabStopType.LEFT, position: 720 }] : []),
          { type: TabStopType.RIGHT, position: isHalfCell ? 4500 : getHeaderFillTwips(r.category) }
        ],
        spacing: { line: 520, lineRule: LineRuleType.EXACT, after: 0 }
      });
    };

    const memoPair = (left: InstanceType<typeof Paragraph>, right: InstanceType<typeof Paragraph>, leftWidth = 54) =>
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        rows: [
          new TableRow({
            children: [
              new TableCell({ width: { size: leftWidth, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.BOTTOM, children: [left] }),
              new TableCell({ width: { size: 100 - leftWidth, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.BOTTOM, children: [right] })
            ]
          })
        ]
      });

    const spec = getTemplateSpec(r.category);
    const firstTop = spec.firstPageTop;
    const memoFooter = () => new Footer({
      children: [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [new TextRun({ text: 'CPRU-66-001', font, size: 30, language: { value: 'th-TH' } })] })]
                }),
                new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], font, size: 30, language: { value: 'th-TH' } })] })] })
              ]
            })
          ]
        })
      ]
    });

    const memoSections = targets.map((to, targetIdx) => ({
      properties: {
        titlePage: firstTop !== undefined,
        page: {
          size: { width: pageWidth, height: pageHeight },
          margin: {
            ...pageMargins,
            ...(firstTop !== undefined ? { top: mmToTwips(firstTop), header: mmToTwips(15), footer: mmToTwips(15) } : {})
          }
        }
      },
      ...(firstTop !== undefined ? {
        // หน้าแรกเริ่มหัวเอกสารสูงตามต้นฉบับ หน้าถัดไปดันเนื้อหาลงให้ได้ขอบบนมาตรฐานด้วยหัวกระดาษเปล่า
        headers: {
          first: new Header({ children: [new Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT }, children: [] })] }),
          default: new Header({ children: [new Paragraph({ spacing: { before: 0, after: 0, line: mmToTwips(spec.margins.top - 15), lineRule: LineRuleType.EXACT }, children: [] })] })
        }
      } : {}),
      footers: {
        default: memoFooter(),
        ...(firstTop !== undefined ? { first: memoFooter() } : {})
      },
      children: [
        // ตราครุฑลอยอิสระ 1.5 ซม. ตามต้นฉบับ (ลอยขึ้นเหนือบรรทัดหัวเรื่อง ชิดซ้าย อยู่สูงจากขอบกระดาษ 1 ซม.)
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 600, lineRule: LineRuleType.EXACT, after: 0 },
          children: [
            ...(garudaBytes ? [new ImageRun({
              type: 'png',
              data: garudaBytes,
              transformation: { width: 56, height: 58 },
              floating: {
                horizontalPosition: { relative: HorizontalPositionRelativeFrom.COLUMN, offset: 0 },
                verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: -Math.round(((firstTop ?? 10) - 10) * 36000) },
                wrap: { type: TextWrappingType.NONE },
                allowOverlap: true,
                behindDocument: false
              }
            })] : []),
            new TextRun({ text: 'บันทึกข้อความ', font, size: 58, bold: true, language: { value: 'th-TH' } })
          ]
        }),
        field('ส่วนราชการ', r.from, r.lineVisibility?.govOrg ?? true),
        memoPair(
          field('ที่', displayNum, r.lineVisibility?.docNumber ?? true, true),
          field('วันที่', thaiGovDate(r.date, digitType, 'memo'), r.lineVisibility?.docDate ?? true, true)
        ),
        field('เรื่อง', cleanSubject, r.lineVisibility?.subject ?? true, false, 'tab'),
        new Paragraph({
          children: [run('เรียน'), new TextRun({ text: '\t', font, size: 32, language: { value: 'th-TH' } }), run(to)],
          tabStops: [{ type: TabStopType.LEFT, position: 720 }],
          spacing: { before: 120, after: 120, ...SINGLE }
        }),
        ...(!cleanReference ? [] : [para('อ้างถึง  ' + cleanReference)]),
        ...(r.attachmentsList || []).map((item, i) => para((i === 0 ? 'สิ่งที่ส่งมาด้วย  ' : '                  ') + (i + 1) + '. ' + item)),
        ...getBodyBlocks(r).flatMap(b => body(b, { ...SINGLE, before: b.text.startsWith('จึงเรียน') ? 240 : 120, after: 0 })),
        ...signatureParagraphs,
        ...(r.coordinatorInfo ? [para(r.coordinatorInfo, { spacing: { before: 240, after: 0 } })] : [])
      ]
    }));

    return Packer.toBlob(new Document({ styles: docStyles, sections: memoSections }));
  }

  if (isOrder) {
    const orderHeadingIndent = mmToTwips(orderLayout.headingIndentMm);
    const orderDateIndent = mmToTwips(orderLayout.dateIndentMm);
    // รูปแบบย่อหน้าชุดเดียวกับแม่แบบ Word และ Preview (orderParaStyles)
    const orderList = orderItems(getBodyBlocks(r));
    const orderStyleList = orderParaStyles(orderList.map(i => i.text), orderHeadingIndent, orderDateIndent);
    const orderBody = orderList.flatMap(({ text: block, block: rich }, k) => {
      const st = orderStyleList[k];
      if (st.kind === 'break') return [new Paragraph({ children: [new PageBreak()] }), para(' ')];
      const spacing = { before: st.before, after: st.after, line: st.line, lineRule: LineRuleType.AUTO };
      const indent = { firstLine: st.firstLine, left: st.left };
      if (st.kind === 'member') {
        const mem = parseCommitteeRow(block);
        return new Paragraph({
          children: [run(mem.name), new TextRun({ text: '\t', font, size: 32, language: { value: 'th-TH' } }), run(mem.role)],
          indent,
          tabStops: [{ type: TabStopType.LEFT, position: 6460 }],
          spacing,
          keepLines: true
        });
      }
      if (st.kind === 'heading') return new Paragraph({ children: [run(block, true)], indent, spacing, keepNext: true });
      if (st.kind === 'duty') {
        // ตัวหนาเฉพาะคำว่า "หน้าที่" ข้อความต่อท้ายเป็นตัวปกติ ตามต้นฉบับ
        const rest = block.slice('หน้าที่'.length);
        return new Paragraph({
          children: [run('หน้าที่', true), ...(rest.trim() ? [run(rest)] : [])],
          alignment: AlignmentType.THAI_DISTRIBUTE,
          indent,
          spacing,
          keepNext: !rest.trim()
        });
      }
      if (st.kind === 'dutyItem') return new Paragraph({ children: [run(block)], alignment: AlignmentType.THAI_DISTRIBUTE, indent, spacing });
      if (st.kind === 'date') return new Paragraph({ children: [run(block)], indent, spacing, keepNext: true });
      return new Paragraph({
        children: blockRuns(rich),
        alignment: alignMap[rich.align],
        indent: { firstLine: rich.firstLine ? st.firstLine : 0, left: rich.indent * INDENT_STEP_TWIPS },
        spacing
      });
    });

    const hasDateInBody = orderItems(getBodyBlocks(r)).some(i => i.text.startsWith('สั่ง ณ วันที่'));

    const orderSections = [{
      properties: {
        page: {
          size: { width: pageWidth, height: pageHeight },
          margin: pageMargins
        }
      },
      children: [
        // ตราครุฑลอยกึ่งกลางตามต้นฉบับ: ย่อหน้าตัวยึดสูงเท่าบล็อกครุฑเพื่อให้หัวคำสั่งอยู่ตำแหน่งเดียวกับต้นฉบับ
        new Paragraph({
          spacing: { before: 0, after: 0, line: mmToTwips(orderLayout.headerBlockMm), lineRule: LineRuleType.EXACT },
          keepNext: true,
          children: garudaBytes ? [new ImageRun({
            type: 'png',
            data: garudaBytes,
            transformation: { width: Math.round(orderLayout.garuda.widthMm * 96 / 25.4), height: Math.round(orderLayout.garuda.heightMm * 96 / 25.4) },
            floating: {
              horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.CENTER },
              verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: Math.round(orderLayout.garuda.topOffsetMm * 36000) },
              wrap: { type: TextWrappingType.NONE },
              allowOverlap: true,
              behindDocument: false
            }
          })] : []
        }),
        new Paragraph({ children: [run('คำสั่ง' + (r.from || '').trim().replace(/^คำสั่ง\s*/, ''), true)], alignment: AlignmentType.CENTER, spacing: { ...SINGLE, after: 0 }, keepNext: true }),
        new Paragraph({ children: [run(formattedOrderNum, true)], alignment: AlignmentType.CENTER, spacing: { ...SINGLE, after: 0 }, keepNext: true }),
        ...cleanSubject.split('\n').map((line, i) => new Paragraph({
          children: [run(i === 0 ? 'เรื่อง  ' + line : line, true)],
          alignment: AlignmentType.CENTER,
          ...(i === 0 ? { indent: { left: 1418, hanging: 1418 } } : {}),
          spacing: { ...SINGLE, after: 0 },
          keepNext: true
        })),
        new Paragraph({ children: [run('........................................................', true)], alignment: AlignmentType.CENTER, spacing: { ...SINGLE, after: 120 }, keepNext: true }),
        ...orderBody,
        ...(!hasDateInBody ? [new Paragraph({ children: [run(thaiGovDate(r.date, digitType, 'order'))], indent: { left: orderDateIndent }, spacing: { before: 120, after: 60, ...SINGLE }, keepNext: true })] : []),
        ...signatureParagraphs,
        ...(r.coordinatorInfo ? [para(r.coordinatorInfo)] : [])
      ]
    }];

    return Packer.toBlob(new Document({ styles: docStyles, sections: orderSections }));
  }

  // External correspondence & Custom layouts
  const extField = (label: string, text: string, indent = 720) =>
    new Paragraph({
      children: [run(label), new TextRun({ text: '\t', font, size: 32, language: { value: 'th-TH' } }), run(text)],
      indent: { left: indent, hanging: indent },
      tabStops: [{ type: TabStopType.LEFT, position: indent }],
      spacing: { ...SINGLE, before: 120, after: 0 }
    });

  const extSections = targets.map(to => ({
    properties: {
      page: {
        size: { width: pageWidth, height: pageHeight },
        margin: pageMargins
      }
    },
    children: [
      // ตราครุฑลอยอิสระตามต้นฉบับ: ผูกกับย่อหน้าเหนือตารางเพื่อให้ระยะวัดจากขอบเนื้อหา (ไม่ใช่จากเซลล์)
      ...(garudaBytes && letterSpec ? [
        new Paragraph({
          children: [new ImageRun({
            type: 'png',
            data: garudaBytes,
            transformation: { width: Math.round(letterSpec.garuda.widthMm * 96 / 25.4), height: Math.round(letterSpec.garuda.heightMm * 96 / 25.4) },
            floating: {
              horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, offset: Math.round(letterSpec.garuda.leftMm * 36000) },
              verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
              wrap: { type: TextWrappingType.NONE },
              allowOverlap: true,
              behindDocument: false
            }
          })],
          spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT }
        })
      ] : []),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                children: [
                  new Paragraph({
                    children: [run(displayNum)],
                    spacing: { before: 1400, ...SINGLE, after: 0 }
                  })
                ]
              }),
              new TableCell({
                width: { size: 28.5, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                children: [
                  new Paragraph({ children: [] })
                ]
              }),
              new TableCell({
                width: { size: 36.5, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                children: [
                  new Paragraph({
                    children: (r.officeAddress || r.from).split('\n').flatMap((line, idx) => [
                      ...(idx ? [new TextRun({ break: 1, font, size: 32, language: { value: 'th-TH' } })] : []),
                      run(line)
                    ]),
                    spacing: { before: 1400, ...SINGLE, after: 0 }
                  })
                ]
              })
            ]
          })
        ]
      }),
      para(thaiGovDate(r.date, digitType, 'external'), { indent: { left: 4252 }, spacing: { before: 180, after: 120, ...SINGLE } }),
      extField('เรื่อง', cleanSubject),
      extField('เรียน', to),
      ...(cleanReference ? [extField('อ้างถึง', cleanReference)] : []),
      ...(r.attachmentsList || []).map((att, i) => {
        const parsed = parseAttachmentRow(att);
        const numText = display(String(i + 1)) + '. ' + parsed.item;
        if (parsed.qty) {
          return new Paragraph({
            children: [
              run(i === 0 ? 'สิ่งที่ส่งมาด้วย' : ''),
              new TextRun({ text: '\t', font, size: 32, language: { value: 'th-TH' } }),
              run(numText),
              new TextRun({ text: '\t', font, size: 32, language: { value: 'th-TH' } }),
              run(parsed.qty)
            ],
            indent: { left: 1417, hanging: 1417 },
            tabStops: [
              { type: TabStopType.LEFT, position: 1417 },
              { type: TabStopType.LEFT, position: 7200 }
            ],
            spacing: { ...SINGLE, after: 0 }
          });
        }
        return extField(i === 0 ? 'สิ่งที่ส่งมาด้วย' : '', numText, 1417);
      }),
      ...getBodyBlocks(r).flatMap(b => body(b)),
      para('ขอแสดงความนับถือ', { alignment: AlignmentType.CENTER, indent: { left: closingIndent }, keepNext: true, spacing: { before: letterSpec ? mmToTwips(letterSpec.closingGapMm) : 240, after: 60, ...SINGLE } }),
      ...signatureParagraphs,
      ...(r.coordinatorInfo ? [new Paragraph({
        children: r.coordinatorInfo.split('\n').flatMap((line, idx) => [
          ...(idx ? [new TextRun({ break: 1, font, size: 32, language: { value: 'th-TH' } })] : []),
          new TextRun({ text: display(line), font, size: 32, sizeComplexScript: 32, language: { value: 'th-TH' } })
        ]),
        spacing: { before: letterSpec ? mmToTwips(letterSpec.coordinatorGapMm) : 240, after: 0, ...SINGLE }
      })] : [])
    ]
  }));

  return Packer.toBlob(new Document({ styles: docStyles, sections: extSections }));
}

export async function exportAdminWord(r: AdminDocRegistryRecord) {
  const blob = await buildAdminWord(r);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileNameNum = (r.docNumber || 'ฉบับร่าง').replace(/[\\/:*?"<>|]/g, '-');
  a.download = `${fileNameNum}.docx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
