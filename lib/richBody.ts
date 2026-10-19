/**
 * เนื้อหาเอกสารแบบ Rich Text (ตัวหนา เอียง ขีดเส้นใต้ จัดแนว เยื้อง)
 *
 * เก็บเป็น HTML ชุดเล็กที่ควบคุมเอง (เฉพาะ p, br, strong, em, u) แล้วแปลงเป็น block กลาง
 * ให้ Preview, PDF และ Word ใช้ข้อมูลเดียวกัน ไม่พึ่ง DOM จึงรันได้ทั้งเบราว์เซอร์และ Node (เทสต์)
 */
export type RichAlign = 'left' | 'center' | 'right' | 'justify';

export interface RichRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface RichBlock {
  runs: RichRun[];
  /** ข้อความล้วนของ block (ขึ้นบรรทัดใหม่ด้วย \n) */
  text: string;
  align: RichAlign;
  /** เยื้องบรรทัดแรก 2.5 ซม. ตามระเบียบงานสารบรรณ */
  firstLine: boolean;
  /** ระดับย่อหน้าเยื้องซ้าย ระดับละ 1.27 ซม. */
  indent: number;
}

export const MAX_INDENT_LEVEL = 6;
export const INDENT_STEP_MM = 12.7;
export const INDENT_STEP_TWIPS = 720;

const ALIGNS: RichAlign[] = ['left', 'center', 'right', 'justify'];

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : '';
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function newBlock(text = '', patch: Partial<RichBlock> = {}): RichBlock {
  return {
    runs: text ? [{ text }] : [],
    text,
    align: 'justify',
    firstLine: true,
    indent: 0,
    ...patch
  };
}

function pushRun(block: RichBlock, text: string, bold: boolean, italic: boolean, underline: boolean) {
  if (!text) return;
  const last = block.runs[block.runs.length - 1];
  if (last && !!last.bold === bold && !!last.italic === italic && !!last.underline === underline) {
    last.text += text;
  } else {
    block.runs.push({ text, ...(bold ? { bold } : {}), ...(italic ? { italic } : {}), ...(underline ? { underline } : {}) });
  }
  block.text += text;
}

function readBlockAttrs(attrs: string): Partial<RichBlock> {
  const patch: Partial<RichBlock> = {};
  const align = /text-align\s*:\s*(left|center|right|justify)/i.exec(attrs);
  if (align) patch.align = align[1].toLowerCase() as RichAlign;
  if (/data-first\s*=\s*["']?0/i.test(attrs)) patch.firstLine = false;
  const indent = /data-indent\s*=\s*["']?(\d+)/i.exec(attrs);
  if (indent) patch.indent = Math.min(MAX_INDENT_LEVEL, parseInt(indent[1], 10));
  return patch;
}

/** แปลง HTML เป็น block กลาง แท็กและแอตทริบิวต์นอกรายการที่อนุญาตจะถูกทิ้ง (เหลือเฉพาะข้อความ) */
export function parseBodyHtml(html: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  let cur: RichBlock | null = null;
  let bold = 0;
  let italic = 0;
  let underline = 0;
  const token = /<!--[\s\S]*?-->|<(script|style)[\s\S]*?<\/\1\s*>|<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>|([^<]+|<)/gi;
  let m: RegExpExecArray | null;
  while ((m = token.exec(html || ''))) {
    if (m[5] !== undefined) {
      if (m[5] === '<') continue;
      if (!cur) cur = newBlock();
      pushRun(cur, decode(m[5]).replace(/\r?\n/g, ' '), !!bold, !!italic, !!underline);
      continue;
    }
    const tag = (m[3] || '').toLowerCase();
    const closing = m[2] === '/';
    if (!tag) continue;
    if (tag === 'p') {
      if (closing) {
        if (cur) blocks.push(cur);
        cur = null;
      } else {
        if (cur) blocks.push(cur);
        cur = newBlock('', readBlockAttrs(m[4] || ''));
      }
    } else if (tag === 'br') {
      if (!cur) cur = newBlock();
      pushRun(cur, '\n', !!bold, !!italic, !!underline);
    } else if (tag === 'strong' || tag === 'b') {
      bold = Math.max(0, bold + (closing ? -1 : 1));
    } else if (tag === 'em' || tag === 'i') {
      italic = Math.max(0, italic + (closing ? -1 : 1));
    } else if (tag === 'u') {
      underline = Math.max(0, underline + (closing ? -1 : 1));
    }
  }
  if (cur) blocks.push(cur);
  return blocks;
}

function runHtml(run: RichRun): string {
  let out = escapeHtml(run.text).replace(/\n/g, '<br>');
  if (run.bold) out = `<strong>${out}</strong>`;
  if (run.italic) out = `<em>${out}</em>`;
  if (run.underline) out = `<u>${out}</u>`;
  return out;
}

export function blockAttrs(block: RichBlock): string {
  let attrs = '';
  if (block.align !== 'justify') attrs += ` style="text-align:${block.align}"`;
  if (!block.firstLine) attrs += ' data-first="0"';
  if (block.indent > 0) attrs += ` data-indent="${block.indent}"`;
  return attrs;
}

export function blocksToBodyHtml(blocks: RichBlock[]): string {
  return blocks.map(b => `<p${blockAttrs(b)}>${b.runs.map(runHtml).join('')}</p>`).join('');
}

/** ล้าง HTML ให้เหลือเฉพาะชุดที่อนุญาต ใช้ก่อนบันทึกและก่อนแสดงผลทุกครั้ง */
export function sanitizeBodyHtml(html: string): string {
  return blocksToBodyHtml(parseBodyHtml(html));
}

/** ย่อหน้าข้อความล้วน (ข้อมูลเดิมและแม่แบบ) เป็น HTML */
export function paragraphsToBodyHtml(paragraphs: string[]): string {
  return blocksToBodyHtml(paragraphs.map(p => newBlock(p)));
}

/** ข้อความล้วนแยกย่อหน้า ใช้กับตรวจสอบเอกสาร ค้นหา และข้อมูลเดิมใน bodyParagraphs */
export function bodyHtmlToParagraphs(html: string): string[] {
  return parseBodyHtml(html)
    .map(b => b.text.trim())
    .filter(Boolean);
}

/** block สำหรับเรนเดอร์: ใช้ bodyHtml ถ้ามี ไม่เช่นนั้นใช้ bodyParagraphs เดิม */
export function getBodyBlocks(r: { bodyHtml?: string; bodyParagraphs?: string[] }): RichBlock[] {
  if (r.bodyHtml && r.bodyHtml.trim()) {
    // ย่อหน้าว่างต่อท้ายไม่มีความหมายต่อเอกสาร
    const blocks = parseBodyHtml(r.bodyHtml);
    while (blocks.length && !blocks[blocks.length - 1].text.trim()) blocks.pop();
    return blocks;
  }
  return (r.bodyParagraphs || []).map(p => newBlock(p));
}

export { ALIGNS as RICH_ALIGNS };
