import type { AdminDocCategory, AdminDocRegistryRecord, UserProfile } from './types';
export const ADMIN_CATEGORIES: string[] = ['order', 'external', 'external_circular', 'memo_circular', 'memo'];
export const ADMIN_ACTIONS = ['ฉบับร่าง', 'รอตรวจ', 'รอลงนาม', 'ลงนามแล้ว'] as const;
export type AdminDocAction = (typeof ADMIN_ACTIONS)[number];
export const ADMIN_RESET_VERSION = '2026-10-09-v3';
export function canManageAdmin(user?: UserProfile | null) {
    if (!user || user.status !== 'active') return false;
    if (user.role === 'admin') return true;
    if (user.permissions?.includes('admin_documents') === true) return true;
    const roles = user.roles || [];
    return roles.includes('แอดมิน') || roles.includes('ธุรการ') || roles.includes('คณบดี') || roles.includes('รองคณบดี') || roles.includes('ผู้บริหาร');
}
export function bangkokDate(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export function validateRegistry(data: Partial<AdminDocRegistryRecord>) {
    if (!data.category?.trim())
        throw new Error('กรุณาระบุประเภทเอกสาร');
    
    // คำสั่ง (Order) ไม่มีช่อง 'เรียน/ถึง'
    const isOrder = data.category === 'order';
    const requiredKeys = isOrder 
        ? (['subject', 'from', 'date'] as const)
        : (['subject', 'from', 'to', 'date'] as const);

    for (const key of requiredKeys) {
        if (!data[key]?.trim()) {
            const fieldLabel = key === 'from' 
                ? (isOrder ? 'หน่วยงานผู้ออกคำสั่ง' : 'ส่วนราชการ/หน่วยงาน') 
                : key === 'to' ? 'เรียน/ถึง' 
                : key === 'subject' ? 'เรื่อง' 
                : 'วันที่';
            throw new Error(`กรุณาระบุ${fieldLabel}`);
        }
    }
    if (data.sequenceNumber !== undefined && data.sequenceNumber !== 0 && (typeof data.sequenceNumber !== 'number' || data.sequenceNumber < 0 || !Number.isInteger(data.sequenceNumber)))
        throw new Error('เลขทะเบียนต้องเป็นจำนวนเต็มบวกหรือยังไม่ออกเลข');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date!))
        throw new Error('วันที่ไม่ถูกต้อง');
    const parsed = new Date(data.date! + 'T00:00:00Z');
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== data.date)
        throw new Error('วันที่ไม่ถูกต้อง');
    if (Number(data.date!.slice(0, 4)) + 543 !== data.year)
        throw new Error('วันที่ต้องตรงกับปีทะเบียนที่เลือก');
    if (data.action && !ADMIN_ACTIONS.includes(data.action as any))
        throw new Error('สถานะไม่ถูกต้อง (ต้องเป็น ฉบับร่าง, รอตรวจ, รอลงนาม หรือ ลงนามแล้ว)');
}
export function registryNumber(category: AdminDocCategory, seq: number, year: number, pattern?: string) {
    if (!seq || seq <= 0) {
        return '';
    }
    if (pattern) {
        return pattern.replace('{seq}', String(seq)).replace('{year}', String(year));
    }
    if (category === 'order')
        return `ที่ ${seq}/${year}`;
    if (category === 'memo')
        return `อว 0646.02/${seq}`;
    if (category === 'memo_circular')
        return `อว 0646.02/ว ${seq}`;
    if (category === 'external')
        return `ที่ อว 0646.02/${seq}`;
    if (category === 'external_circular')
        return `ที่ อว 0646.02/ว ${seq}`;
    return `ที่ ${seq}/${year}`;
}
export function csvCell(value: unknown) {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text))
        text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
}
