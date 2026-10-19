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
  // ลำดับแท็กตาม schema (sz, szCs, u, cs) และใส่ <w:cs/> เหมือนต้นฉบับ
  // ไม่มี <w:cs/> Word จะจัดกระจายแบบไทยโดยถ่างระหว่างอักขระ ทำให้สระ/วรรณยุกต์หลุดจากพยัญชนะ
  const rpr =
    `<w:rPr>${RFONTS}${o.bold ? '<w:b/><w:bCs/>' : ''}${o.italic ? '<w:i/><w:iCs/>' : ''}` +
    `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>${o.underline ? '<w:u w:val="single"/>' : ''}<w:cs/></w:rPr>`;
  return text
    .split('\n')
    .map((line, i) => `${i ? `<w:r>${rpr}<w:br/></w:r>` : ''}${line ? `<w:r>${rpr}<w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r>` : ''}`)
    .join('');
}

export const xmlTab = (size = 32) => `<w:r><w:rPr>${RFONTS}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:cs/></w:rPr><w:tab/></w:r>`;

export interface XmlParaOptions {
  align?: 'left' | 'center' | 'right' | 'distribute';
  firstLine?: number;
  left?: number;
  hanging?: number;
  before?: number;
  after?: number;
  tabs?: number[];
  keepNext?: boolean;
  /** ระยะบรรทัด (240 = บรรทัดเดี่ยว, 259 = ค่าเริ่มต้นของ Word 1.08) */
  line?: number;
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
    `<w:spacing w:before="${o.before ?? 0}" w:after="${o.after ?? 0}" w:line="${o.line ?? 240}" w:lineRule="auto"/>${ind}` +
    `${jc ? `<w:jc w:val="${jc}"/>` : ''}</w:pPr>${inner}</w:p>`
  );
}

/** เนื้อหา Rich Text เป็นย่อหน้า WordprocessingML ตามต้นฉบับ (เยื้องบรรทัดแรก 2.5 ซม. ชิดสองขอบแบบไทย) */
export function blocksToWordXml(
  blocks: RichBlock[],
  display: (t: string) => string,
  beforeFor?: (b: RichBlock) => number,
  extra?: (b: RichBlock) => XmlParaOptions
): string {
  const alignOf = { left: 'left', center: 'center', right: 'right', justify: 'distribute' } as const;
  return blocks
    .map(b =>
      b.pageBreak ? PAGE_BREAK_BLOCK_XML :
      xmlPara(
        b.runs.map(r => xmlRun(display(r.text), { bold: r.bold, italic: r.italic, underline: r.underline })).join('') || xmlRun(' '),
        {
          align: alignOf[b.align],
          firstLine: b.firstLine ? 1417 : 0,
          left: b.indent * INDENT_STEP_TWIPS,
          before: beforeFor ? beforeFor(b) : 120,
          ...(extra ? extra(b) : {})
        }
      )
    )
    .join('');
}

export interface TemplateImage {
  /** รหัสความสัมพันธ์ที่ใช้ใน XML (r:embed) */
  rId: string;
  bytes: Uint8Array;
  ext: 'png' | 'jpg';
}

/** ย่อหน้ารูปลายเซ็น (รูปอยู่ในบรรทัด) อ้างรูปที่เพิ่มด้วย TemplateImage */
export function xmlImagePara(rId: string, widthPx: number, heightPx: number, o: XmlParaOptions = {}): string {
  const cx = Math.round(widthPx * 9525);
  const cy = Math.round(heightPx * 9525);
  const drawing =
    `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="9001" name="Signature"/><wp:cNvGraphicFramePr/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="signature"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
    `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  return xmlPara(drawing, o);
}

/** ขนาดรูป (พิกเซล) จากส่วนหัวไฟล์ PNG หรือ JPEG ไม่รู้จักคืน null */
export function imagePixelSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: dv.getUint32(16), height: dv.getUint32(20) };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) { i++; continue; }
      const marker = bytes[i + 1];
      const len = (bytes[i + 2] << 8) | bytes[i + 3];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: (bytes[i + 7] << 8) | bytes[i + 8], height: (bytes[i + 5] << 8) | bytes[i + 6] };
      }
      i += 2 + len;
    }
  }
  return null;
}

/**
 * รันรูปลอย (ไม่ดันข้อความ) วางตามระยะจากขอบเนื้อหาซ้าย (มม.) และจากบนบรรทัดที่ยึด (มม. ติดลบ = เหนือบรรทัด)
 * ใช้ประทับลายเซ็นเหนือชื่อผู้ลงนามโดยไม่เปลี่ยนระยะของแม่แบบ
 */
export function xmlFloatingImageRun(rId: string, widthMm: number, heightMm: number, leftMm: number, topMm: number): string {
  const emu = (mm: number) => Math.round(mm * 36000);
  const cx = emu(widthMm);
  const cy = emu(heightMm);
  return (
    `<w:r><w:drawing><wp:anchor xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251659264" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">` +
    `<wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="margin"><wp:posOffset>${emu(leftMm)}</wp:posOffset></wp:positionH>` +
    `<wp:positionV relativeFrom="line"><wp:posOffset>${emu(topMm)}</wp:posOffset></wp:positionV>` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="9002" name="Signature"/><wp:cNvGraphicFramePr/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="signature"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
    `</a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>`
  );
}

export const PAGE_BREAK_XML ='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';

/**
 * ตัวแบ่งหน้าในเนื้อหา (ปุ่ม "ขึ้นหน้าใหม่"): ย่อหน้าตัวแบ่งหน้า + บรรทัดว่าง 16 พอยต์บนหน้าใหม่
 * เหมือนต้นฉบับคำสั่งที่กด Ctrl+Enter แล้วเว้นหนึ่งบรรทัดก่อนเนื้อหาถัดไป (Preview/PDF เว้น 6.4 มม. เท่ากัน)
 */
export const PAGE_BREAK_BLOCK_XML =
  PAGE_BREAK_XML +
  // ย่อหน้าว่างขนาด 16 พอยต์ เว้นก่อน 6 พอยต์ ตามต้นฉบับ (เครื่องหมายย่อหน้าต้องกำหนดขนาด ไม่เช่นนั้น Word ใช้ 11 พอยต์)
  `<w:p><w:pPr><w:spacing w:before="120" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr>${RFONTS}<w:sz w:val="32"/><w:szCs w:val="32"/><w:cs/></w:rPr></w:pPr></w:p>`;

/** แทนค่าในแม่แบบ: ค่าธรรมดาใช้ {{tag}} ค่า XML ใช้ {{@tag}} ลูปใช้ {{#list}}...{{/list}} */
export async function renderWordTemplate(
  template: Uint8Array | ArrayBuffer,
  data: Record<string, unknown>,
  images: TemplateImage[] = []
): Promise<Blob> {
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
  const out = doc.getZip();

  // ลูปทำให้ตราครุฑซ้ำหลายฉบับ: ทำรหัสวัตถุไม่ซ้ำกันและตัดรหัสที่ Word สร้างเอง
  let drawingId = 100;
  const docPath = 'word/document.xml';
  let xml = out.file(docPath)!.asText();
  xml = xml.replace(/<wp:docPr id="\d+"/g, () => `<wp:docPr id="${drawingId++}"`).replace(/ wp14:(anchorId|editId)="[^"]*"/g, '');
  out.file(docPath, xml);

  if (images.length) {
    let rels = out.file('word/_rels/document.xml.rels')!.asText();
    let types = out.file('[Content_Types].xml')!.asText();
    for (const img of images) {
      const target = `media/${img.rId}.${img.ext}`;
      out.file(`word/${target}`, img.bytes);
      rels = rels.replace('</Relationships>', `<Relationship Id="${img.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${target}"/></Relationships>`);
      if (!new RegExp(`Extension="${img.ext}"`, 'i').test(types)) {
        types = types.replace('<Override', `<Default Extension="${img.ext}" ContentType="image/${img.ext === 'jpg' ? 'jpeg' : 'png'}"/><Override`);
      }
    }
    out.file('word/_rels/document.xml.rels', rels);
    out.file('[Content_Types].xml', types);
  }
  const bytes = out.generate({ type: 'uint8array', mimeType: DOCX_MIME, compression: 'DEFLATE' });
  return new Blob([bytes as BlobPart], { type: DOCX_MIME });
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
