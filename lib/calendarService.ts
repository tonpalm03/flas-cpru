import { createModuleStore, newItemId, type StoredItem } from './adminModuleStore';

export const CALENDAR_CATEGORIES = ['ประชุม', 'กิจกรรม', 'อบรม/สัมมนา', 'วันสำคัญ/วันหยุด', 'อื่น ๆ'] as const;
export type CalendarCategory = (typeof CALENDAR_CATEGORIES)[number];

export interface CalendarEvent extends StoredItem {
  title: string;
  category: CalendarCategory;
  /** วันเริ่ม YYYY-MM-DD */
  date: string;
  /** วันสิ้นสุด (ไม่ระบุ = วันเดียว) */
  endDate?: string;
  time?: string;
  endTime?: string;
  location?: string;
  description?: string;
  createdById?: string;
  createdByName?: string;
}

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
export const THAI_WEEKDAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export const CATEGORY_STYLES: Record<CalendarCategory, string> = {
  'ประชุม': 'bg-blue-100 text-blue-900',
  'กิจกรรม': 'bg-emerald-100 text-emerald-900',
  'อบรม/สัมมนา': 'bg-violet-100 text-violet-900',
  'วันสำคัญ/วันหยุด': 'bg-rose-100 text-rose-900',
  'อื่น ๆ': 'bg-slate-200 text-slate-800'
};

export const calendarStore = createModuleStore<CalendarEvent>('admin_calendar_events', 'faculty_erp_calendar_events_v1');

export function newCalendarEvent(date: string, author?: { id?: string; name?: string }): CalendarEvent {
  return {
    id: newItemId('event'),
    title: '',
    category: 'กิจกรรม',
    date,
    createdAt: new Date().toISOString(),
    createdById: author?.id,
    createdByName: author?.name
  };
}

const pad = (n: number) => String(n).padStart(2, '0');
export const toIsoDate = (y: number, m0: number, d: number) => `${y}-${pad(m0 + 1)}-${pad(d)}`;

/** ตารางเดือน 6 สัปดาห์ เริ่มวันอาทิตย์ (month0 = 0-11) */
export function monthGrid(year: number, month0: number): { date: string; inMonth: boolean }[][] {
  const first = new Date(Date.UTC(year, month0, 1));
  const start = Date.UTC(year, month0, 1 - first.getUTCDay());
  const weeks: { date: string; inMonth: boolean }[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: { date: string; inMonth: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start + (w * 7 + d) * 86400000);
      row.push({ date: toIsoDate(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()), inMonth: day.getUTCMonth() === month0 });
    }
    weeks.push(row);
  }
  return weeks;
}

/** กิจกรรมที่คร่อมวันที่ระบุ (รวมกิจกรรมหลายวัน) เรียงตามเวลา */
export function eventsOnDate(events: CalendarEvent[], date: string): CalendarEvent[] {
  return events
    .filter(e => e.date <= date && date <= (e.endDate && e.endDate >= e.date ? e.endDate : e.date))
    .sort((a, b) => (a.time || '').localeCompare(b.time || '') || a.title.localeCompare(b.title, 'th'));
}

export function validateCalendarEvent(e: CalendarEvent): string | null {
  if (!e.title.trim()) return 'กรุณาระบุชื่อกิจกรรม/งาน';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return 'กรุณาระบุวันที่';
  if (e.endDate && e.endDate < e.date) return 'วันสิ้นสุดต้องไม่ก่อนวันเริ่ม';
  return null;
}

export const monthLabel = (year: number, month0: number) => `${THAI_MONTHS[month0]} ${year + 543}`;
