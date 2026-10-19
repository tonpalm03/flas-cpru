import { createModuleStore, newItemId, type StoredItem } from './adminModuleStore';
import { getBodyBlocks } from './richBody';
import type { DocPart } from './moduleDocument';
import { thaiDate } from './adminDocument';

export const NEWSLETTER_CATEGORIES = ['ข่าวประชาสัมพันธ์', 'ข่าวกิจกรรม', 'ประกาศ', 'ข่าวทั่วไป'] as const;
export type NewsletterCategory = (typeof NEWSLETTER_CATEGORIES)[number];
export type NewsletterStatus = 'ฉบับร่าง' | 'เผยแพร่แล้ว';

export interface Newsletter extends StoredItem {
  title: string;
  category: NewsletterCategory;
  /** ฉบับที่/ปีที่ เช่น "ฉบับที่ ๓/๒๕๖๙" (ไม่บังคับ) */
  issueLabel?: string;
  summary?: string;
  bodyHtml: string;
  status: NewsletterStatus;
  publishedAt?: string;
  createdById?: string;
  createdByName?: string;
}

export const newsletterStore = createModuleStore<Newsletter>('admin_newsletters', 'faculty_erp_newsletters_v1');

export function newNewsletter(author?: { id?: string; name?: string }): Newsletter {
  return {
    id: newItemId('news'),
    title: '',
    category: 'ข่าวประชาสัมพันธ์',
    bodyHtml: '',
    status: 'ฉบับร่าง',
    createdAt: new Date().toISOString(),
    createdById: author?.id,
    createdByName: author?.name
  };
}

/** ผู้ไม่มีสิทธิ์แก้ไขเห็นเฉพาะฉบับที่เผยแพร่แล้ว ผู้แก้ไขเห็นทั้งหมด */
export function visibleNewsletters(items: Newsletter[], canEdit: boolean): Newsletter[] {
  return items
    .filter(n => canEdit || n.status === 'เผยแพร่แล้ว')
    .sort((a, b) => {
      const ta = new Date(a.publishedAt || a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.publishedAt || b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });
}

export function validateNewsletter(n: Newsletter, forPublish: boolean): string | null {
  if (!n.title.trim()) return 'กรุณาระบุหัวเรื่องข่าว';
  if (forPublish && !getBodyBlocks(n).some(b => b.text.trim())) return 'กรุณาระบุเนื้อหาข่าวก่อนเผยแพร่';
  return null;
}

export function newsletterParts(n: Newsletter): DocPart[] {
  const date = (n.publishedAt || n.createdAt || '').slice(0, 10);
  return [
    { kind: 'subtitle', text: 'จดหมายข่าว คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ' },
    { kind: 'title', text: n.title },
    { kind: 'subtitle', text: [n.category, n.issueLabel, date ? thaiDate(date) : ''].filter(Boolean).join('  |  ') },
    ...(n.summary?.trim() ? [{ kind: 'line', text: n.summary.trim(), bold: true } as DocPart] : []),
    { kind: 'spacer' },
    { kind: 'blocks', blocks: getBodyBlocks(n) }
  ];
}
