import { createModuleStore, newItemId, type StoredItem } from './adminModuleStore';
import { getBodyBlocks } from './richBody';
import type { DocPart } from './moduleDocument';
import { thaiDate, toThaiDigits } from './adminDocument';

export type MeetingStatus = 'นัดหมาย' | 'ประชุมแล้ว' | 'รับรองรายงานแล้ว';
export const MEETING_STATUSES: MeetingStatus[] = ['นัดหมาย', 'ประชุมแล้ว', 'รับรองรายงานแล้ว'];

export interface AgendaItem {
  id: string;
  title: string;
  /** รายละเอียดวาระ (ใช้ทั้งในระเบียบวาระและรายงานการประชุม) */
  detailHtml: string;
  /** มติ/ผลการประชุม (บันทึกหลังประชุม แสดงในรายงานการประชุม) */
  resolutionHtml: string;
}

export interface Meeting extends StoredItem {
  title: string;
  /** ครั้งที่ เช่น "๓/๒๕๖๙" */
  meetingNo?: string;
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  chair?: string;
  attendees?: string;
  absentees?: string;
  recorder?: string;
  agendaItems: AgendaItem[];
  status: MeetingStatus;
  createdById?: string;
  createdByName?: string;
}

export const STANDARD_AGENDA_TITLES = [
  'เรื่องที่ประธานแจ้งให้ที่ประชุมทราบ',
  'เรื่องรับรองรายงานการประชุมครั้งที่แล้ว',
  'เรื่องสืบเนื่อง',
  'เรื่องเพื่อทราบ',
  'เรื่องเพื่อพิจารณา',
  'เรื่องอื่น ๆ'
];

export const meetingStore = createModuleStore<Meeting>('admin_meetings', 'faculty_erp_meetings_v1');

export function newAgendaItem(title = ''): AgendaItem {
  return { id: newItemId('agenda'), title, detailHtml: '', resolutionHtml: '' };
}

export function newMeeting(author?: { id?: string; name?: string }, today = new Date().toISOString().slice(0, 10)): Meeting {
  return {
    id: newItemId('meeting'),
    title: 'การประชุมคณะศิลปศาสตร์และวิทยาศาสตร์',
    date: today,
    agendaItems: [],
    status: 'นัดหมาย',
    createdAt: new Date().toISOString(),
    createdById: author?.id,
    createdByName: author?.name
  };
}

export function validateMeeting(m: Meeting): string | null {
  if (!m.title.trim()) return 'กรุณาระบุชื่อการประชุม';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date)) return 'กรุณาระบุวันที่ประชุม';
  if (m.agendaItems.some(a => !a.title.trim())) return 'กรุณาระบุชื่อวาระให้ครบทุกข้อ';
  return null;
}

/** เรียงการประชุมล่าสุดก่อน */
export function sortMeetings(items: Meeting[]): Meeting[] {
  return [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

const thaiNo = (n: number) => toThaiDigits(String(n));

function headLines(m: Meeting): DocPart[] {
  const when = [m.date ? `วันที่ ${thaiDate(m.date)}` : '', m.time ? `เวลา ${toThaiDigits(m.time)} น.` : ''].filter(Boolean).join(' ');
  return [
    { kind: 'subtitle', text: 'คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ' },
    ...(when || m.location ? ([{ kind: 'subtitle', text: [when, m.location ? `ณ ${m.location}` : ''].filter(Boolean).join(' ') }] as DocPart[]) : [])
  ];
}

/** ระเบียบวาระการประชุม */
export function agendaParts(m: Meeting): DocPart[] {
  const parts: DocPart[] = [
    { kind: 'title', text: `ระเบียบวาระการประชุม${m.meetingNo ? ` ครั้งที่ ${toThaiDigits(m.meetingNo)}` : ''}` },
    { kind: 'subtitle', text: m.title },
    ...headLines(m)
  ];
  m.agendaItems.forEach((a, i) => {
    parts.push({ kind: 'heading', text: `ระเบียบวาระที่ ${thaiNo(i + 1)} ${a.title}` });
    const blocks = getBodyBlocks({ bodyHtml: a.detailHtml });
    if (blocks.length) parts.push({ kind: 'blocks', blocks });
  });
  return parts;
}

/** รายงานการประชุม: ผู้เข้าร่วม วาระ รายละเอียด และมติที่ประชุม */
export function minutesParts(m: Meeting): DocPart[] {
  const lines = (s?: string) => (s || '').split('\n').map(x => x.trim()).filter(Boolean);
  const parts: DocPart[] = [
    { kind: 'title', text: `รายงานการประชุม${m.meetingNo ? ` ครั้งที่ ${toThaiDigits(m.meetingNo)}` : ''}` },
    { kind: 'subtitle', text: m.title },
    ...headLines(m)
  ];
  if (m.chair?.trim()) {
    parts.push({ kind: 'heading', text: 'ประธานในที่ประชุม' }, { kind: 'line', text: m.chair.trim() });
  }
  const present = lines(m.attendees);
  if (present.length) {
    parts.push({ kind: 'heading', text: 'ผู้มาประชุม' }, ...present.map((p, i) => ({ kind: 'line', text: `${thaiNo(i + 1)}. ${p}` }) as DocPart));
  }
  const absent = lines(m.absentees);
  if (absent.length) {
    parts.push({ kind: 'heading', text: 'ผู้ไม่มาประชุม' }, ...absent.map((p, i) => ({ kind: 'line', text: `${thaiNo(i + 1)}. ${p}` }) as DocPart));
  }
  if (m.time) parts.push({ kind: 'heading', text: `เริ่มประชุมเวลา ${toThaiDigits(m.time)} น.` });
  m.agendaItems.forEach((a, i) => {
    parts.push({ kind: 'heading', text: `ระเบียบวาระที่ ${thaiNo(i + 1)} ${a.title}` });
    const detail = getBodyBlocks({ bodyHtml: a.detailHtml });
    if (detail.length) parts.push({ kind: 'blocks', blocks: detail });
    const resolution = getBodyBlocks({ bodyHtml: a.resolutionHtml });
    if (resolution.length) {
      parts.push({ kind: 'line', text: 'มติที่ประชุม', bold: true }, { kind: 'blocks', blocks: resolution });
    }
  });
  if (m.endTime) parts.push({ kind: 'spacer' }, { kind: 'line', text: `เลิกประชุมเวลา ${toThaiDigits(m.endTime)} น.` });
  if (m.recorder?.trim()) {
    parts.push({ kind: 'spacer' }, { kind: 'line', text: `ผู้จดรายงานการประชุม  ${m.recorder.trim()}` });
  }
  return parts;
}
