import { INDENT_STEP_TWIPS, type RichBlock } from './richBody';

/**
 * ส่งออก Word จากไฟล์แม่แบบต้นฉบับของคณะ (public/templates/admin/word/*.docx)
 * ส่วนหัว/ส่วนท้าย ตราครุฑ ฟอนต์ และหน้ากระดาษมาจากไฟล์ต้นฉบับโดยตรง
 * ระบบแทนเฉพาะค่าที่เปลี่ยนตามเอกสารด้วย docxtemplater (ประมวลผลฝั่งผู้ใช้ทั้งหมด)
 */
const FONT = 'TH SarabunIT๙';
const RFONTS = `<w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}"/>`;
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const escapeXml = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));

export interface XmlRunOptions {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  size?: number;
}

/** รัน (ข้อความ) พร้อมรูปแบบ ขึ้นบรรทัดใหม่ด้วย \n */
export function xmlRun(text: string, o: XmlRunOptions = {}): string {
  const size = o.size ?? 32;
  const rpr =
    `<w:rPr>${RFONTS}${o.bold ? '<w:b/><w:bCs/>' : ''}${o.italic ? '<w:i/><w:iCs/>' : ''}` +
    `${o.underline ? '<w:u w:val="single"/>' : ''}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr>`;
  return text
    .split('\n')
    .map((line, i) => `${i ? `<w:r>${rpr}<w:br/></w:r>` : ''}${line ? `<w:r>${rpr}<w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r>` : ''}`)
    .join('');
}

export const xmlTab = (size = 32) => `<w:r><w:rPr>${RFONTS}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:tab/></w:r>`;

export interface XmlParaOptions {
  align?: 'left' | 'center' | 'right' | 'distribute';
  firstLine?: number;
  left?: number;
  hanging?: number;
  before?: number;
  after?: number;
  tabs?: number[];
  keepNext?: boolean;
}

export function xmlPara(inner: string, o: XmlParaOptions = {}): string {
  const jc = o.align === 'distribute' ? 'thaiDistribute' : o.align;
  const ind =
    o.firstLine || o.left || o.hanging
      ? `<w:ind${o.left ? ` w:left="${o.left}"` : ''}${o.firstLine ? ` w:firstLine="${o.firstLine}"` : ''}${o.hanging ? ` w:hanging="${o.hanging}"` : ''}/>`
      : '';
  const tabs = o.tabs?.length ? `<w:tabs>${o.tabs.map(t => `<w:tab w:val="left" w:pos="${t}"/>`).join('')}</w:tabs>` : '';
  return (
    `<w:p><w:pPr>${o.keepNext ? '<w:keepNext/>' : ''}${tabs}` +
    `<w:spacing w:before="${o.before ?? 0}" w:after="${o.after ?? 0}" w:line="240" w:lineRule="auto"/>${ind}` +
    `${jc ? `<w:jc w:val="${jc}"/>` : ''}</w:pPr>${inner}</w:p>`
  );
}

/** เนื้อหา Rich Text เป็นย่อหน้า WordprocessingML ตามต้นฉบับ (เยื้องบรรทัดแรก 2.5 ซม. ชิดสองขอบแบบไทย) */
export function blocksToWordXml(blocks: RichBlock[], display: (t: string) => string, beforeFor?: (b: RichBlock) => number): string {
  const alignOf = { left: 'left', center: 'center', right: 'right', justify: 'distribute' } as const;
  return blocks
    .map(b =>
      xmlPara(
        b.runs.map(r => xmlRun(display(r.text), { bold: r.bold, italic: r.italic, underline: r.underline })).join('') || xmlRun(' '),
        {
          align: alignOf[b.align],
          firstLine: b.firstLine ? 1417 : 0,
          left: b.indent * INDENT_STEP_TWIPS,
          before: beforeFor ? beforeFor(b) : 120
        }
      )
    )
    .join('');
}

/** แทนค่าในแม่แบบ: ค่าธรรมดาใช้ {{tag}} ค่า XML ใช้ {{@tag}} */
export async function renderWordTemplate(template: Uint8Array | ArrayBuffer, data: Record<string, string>): Promise<Blob> {
  const [{ default: PizZip }, { default: Docxtemplater }] = await Promise.all([import('pizzip'), import('docxtemplater')]);
  const zip = new PizZip(template);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: '{{', end: '}}' },
    paragraphLoop: true,
    linebreaks: true,
    // แท็กที่ไม่มีข้อมูลให้เป็นค่าว่าง ไม่ใช่คำว่า undefined
    nullGetter: () => ''
  });
  doc.render(data);
  const out = doc.getZip().generate({ type: 'uint8array', mimeType: DOCX_MIME, compression: 'DEFLATE' });
  return new Blob([out as BlobPart], { type: DOCX_MIME });
}

/** โหลดไฟล์แม่แบบ: เบราว์เซอร์ใช้ fetch, Node (เทสต์) อ่านจาก public/ */
export async function loadWordTemplate(name: string): Promise<Uint8Array | null> {
  const rel = `templates/admin/word/${name}.docx`;
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch('/' + rel);
      return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
    }
    const fs = await import('fs');
    const path = await import('path');
    const file = path.join(process.cwd(), 'public', rel);
    return fs.existsSync(file) ? new Uint8Array(fs.readFileSync(file)) : null;
  } catch {
    return null;
  }
}
