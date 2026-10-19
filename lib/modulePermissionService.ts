import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import { ALL_STANDARD_ROLES } from './types';
import type { UserProfile } from './types';
import { getUserRoles, isUserActive } from './workflowPermissionService';

/**
 * สิทธิ์ต่อโมดูลงานธุรการ (จดหมายข่าว วาระการประชุม ตารางงาน)
 * ทุกคนที่ล็อกอินและบัญชีใช้งานได้ ดูได้ ส่วนการแก้ไขกำหนดเป็นรายยศ แอดมินแก้ไขได้เสมอ
 */
export type AdminModuleKey = 'newsletter' | 'meetings' | 'calendar';

export interface ModulePermissionConfig {
  id: AdminModuleKey;
  title: string;
  /** ยศที่แก้ไขได้ (เพิ่ม/แก้/ลบ/เผยแพร่) */
  editorRoles: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export const ADMIN_MODULES: { key: AdminModuleKey; title: string; href: string }[] = [
  { key: 'newsletter', title: 'ระบบจดหมายข่าว', href: '/admin/newsletter' },
  { key: 'meetings', title: 'วาระการประชุม', href: '/admin/meetings' },
  { key: 'calendar', title: 'ระบบตารางงาน', href: '/admin/calendar' }
];

export const DEFAULT_MODULE_PERMISSIONS: Record<AdminModuleKey, ModulePermissionConfig> = {
  newsletter: { id: 'newsletter', title: 'ระบบจดหมายข่าว', editorRoles: ['แอดมิน', 'ธุรการ'] },
  meetings: { id: 'meetings', title: 'วาระการประชุม', editorRoles: ['แอดมิน', 'ธุรการ'] },
  calendar: { id: 'calendar', title: 'ระบบตารางงาน', editorRoles: ['แอดมิน', 'ธุรการ'] }
};

export const MODULE_ROLE_OPTIONS: string[] = [...ALL_STANDARD_ROLES];

const CACHE_KEY = 'faculty_erp_module_permissions_v1';

function isAdminUser(user: UserProfile | null): boolean {
  return !!user && (user.role === 'admin' || getUserRoles(user).includes('แอดมิน'));
}

/** ทุกคนที่บัญชีใช้งานได้ดูโมดูลได้ */
export function canUserViewModule(user: UserProfile | null): boolean {
  return isUserActive(user);
}

/** แอดมินแก้ไขได้เสมอ ผู้อื่นต้องถือยศที่กำหนดไว้ในโมดูลนั้น */
export function canUserEditModule(user: UserProfile | null, config: ModulePermissionConfig): boolean {
  if (!isUserActive(user)) return false;
  if (isAdminUser(user)) return true;
  const roles = getUserRoles(user);
  return config.editorRoles.some(r => roles.includes(r));
}

/** ล้างค่าที่ผู้ใช้ส่งมาให้เหลือเฉพาะยศมาตรฐาน และบังคับให้มี "แอดมิน" เสมอ */
export function normalizeEditorRoles(roles: string[]): string[] {
  const valid = new Set(roles.filter(r => MODULE_ROLE_OPTIONS.includes(r)));
  valid.add('แอดมิน');
  return MODULE_ROLE_OPTIONS.filter(r => valid.has(r));
}

function readCache(): Partial<Record<AdminModuleKey, ModulePermissionConfig>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function writeCache(config: ModulePermissionConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...readCache(), [config.id]: config }));
  } catch {}
}

function withDefaults(key: AdminModuleKey, stored?: Partial<ModulePermissionConfig> | null): ModulePermissionConfig {
  const base = DEFAULT_MODULE_PERMISSIONS[key];
  if (!stored || !Array.isArray(stored.editorRoles)) return base;
  return { ...base, ...stored, id: key, editorRoles: normalizeEditorRoles(stored.editorRoles) };
}

/** อ่านสิทธิ์โมดูล: แคชในเครื่องก่อน แล้วอัปเดตจาก Firestore (หมดเวลา 1.5 วินาที) */
export async function getModulePermission(key: AdminModuleKey): Promise<ModulePermissionConfig> {
  const cached = readCache()[key];
  if (!isConfigured || !db) return withDefaults(key, cached);
  try {
    const snap = await Promise.race([
      getDoc(doc(db, 'system_module_permissions', key)),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
    ]);
    if (snap && snap.exists()) {
      const config = withDefaults(key, snap.data() as ModulePermissionConfig);
      writeCache(config);
      return config;
    }
  } catch {
    // ใช้แคชหรือค่าเริ่มต้นเมื่อออฟไลน์/หมดเวลา
  }
  return withDefaults(key, cached);
}

/** บันทึกสิทธิ์โมดูล เฉพาะแอดมิน */
export async function saveModulePermission(
  key: AdminModuleKey,
  editorRoles: string[],
  actor: UserProfile
): Promise<ModulePermissionConfig> {
  if (!isAdminUser(actor)) {
    throw new Error('มีเฉพาะแอดมินเท่านั้นที่สามารถกำหนดสิทธิ์การแก้ไขโมดูลได้');
  }
  const config: ModulePermissionConfig = {
    ...DEFAULT_MODULE_PERMISSIONS[key],
    editorRoles: normalizeEditorRoles(editorRoles),
    updatedAt: new Date().toISOString(),
    updatedBy: actor.name || actor.email || actor.id
  };
  writeCache(config);
  if (isConfigured && db) {
    try {
      await Promise.race([
        setDoc(doc(db, 'system_module_permissions', key), { ...config, timestamp: serverTimestamp() }, { merge: true }),
        new Promise<void>(resolve => setTimeout(resolve, 2000))
      ]);
    } catch (err) {
      console.warn('saveModulePermission cloud error:', err);
    }
  }
  return config;
}
