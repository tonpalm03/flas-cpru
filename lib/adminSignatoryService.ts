import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import type { SignatoryPreset, UserProfile } from './types';
import { canManageAdmin } from './adminRegistryModel';

export const DEFAULT_SIGNATORY_PRESETS: SignatoryPreset[] = [
  {
    id: 'dean',
    label: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    name: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
    position: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    orderIndex: 1,
    isActive: true
  },
  {
    id: 'acting_dean',
    label: 'คณบดี (ปฏิบัติราชการแทนอธิการบดี)',
    name: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
    position: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์ ปฏิบัติราชการแทน\nอธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ',
    orderIndex: 2,
    isActive: true
  },
  {
    id: 'vice_dean_academic',
    label: 'รองคณบดีฝ่ายวิชาการและวิจัย',
    name: 'ผู้ช่วยศาสตราจารย์ ดร.วันวิสาข์ ปิ่นเพ็ชร',
    position: 'รองคณบดีฝ่ายวิชาการและวิจัย',
    orderIndex: 3,
    isActive: true
  },
  {
    id: 'vice_dean_admin',
    label: 'รองคณบดีฝ่ายบริหารและแผนงาน',
    name: 'อาจารย์พงศ์ธร มิ่งเมือง',
    position: 'รองคณบดีฝ่ายบริหารและแผนงาน',
    orderIndex: 4,
    isActive: true
  },
  {
    id: 'office_head',
    label: 'หัวหน้าสำนักงานคณบดี',
    name: 'นางสาวศิริพร บุญช่วย',
    position: 'หัวหน้าสำนักงานคณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    orderIndex: 5,
    isActive: true
  }
];

const LOCAL_STORAGE_KEY = 'faculty_erp_admin_signatories_cache';

/**
 * ดึงรายชื่อผู้ลงนามทั้งหมด (จากแคช หรือ Firestore หรือค่าตั้งต้น)
 */
export async function getSignatoryPresets(): Promise<SignatoryPreset[]> {
  const defaults = [...DEFAULT_SIGNATORY_PRESETS];

  // Try local cache first
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
  }

  if (!isConfigured) {
    return defaults;
  }

  try {
    const docRef = doc(db, 'system_master_settings', 'signatories');
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.items) && data.items.length > 0) {
        const sorted = [...data.items].sort((a, b) => (a.orderIndex || 99) - (b.orderIndex || 99));
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sorted));
          } catch {}
        }
        return sorted;
      }
    }

    return defaults;
  } catch (err) {
    console.warn('getSignatoryPresets fallback to defaults/cache:', err);
    return defaults;
  }
}

/**
 * บันทึกรายชื่อผู้ลงนามทั้งหมดลง Firestore และอัปเดตแคชในเครื่อง
 */
export async function saveSignatoryPresets(
  presets: SignatoryPreset[],
  actor: UserProfile
): Promise<SignatoryPreset[]> {
  if (!canManageAdmin(actor)) {
    throw new Error('ไม่มีสิทธิ์จัดการรายชื่อผู้ลงนาม');
  }

  const cleaned: SignatoryPreset[] = presets.map((p, idx) => ({
    id: p.id || `signer_${Date.now()}_${idx}`,
    label: p.label.trim(),
    name: p.name.trim(),
    position: p.position.trim(),
    orderIndex: typeof p.orderIndex === 'number' ? p.orderIndex : idx + 1,
    isActive: p.isActive !== false,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.name || actor.email || actor.id
  }));

  if (isConfigured) {
    const docRef = doc(db, 'system_master_settings', 'signatories');
    await setDoc(docRef, {
      items: cleaned,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.name || actor.email || actor.id,
      timestamp: serverTimestamp()
    });
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
      window.dispatchEvent(new CustomEvent('flas_signatories_updated', { detail: cleaned }));
    } catch {}
  }

  return cleaned;
}

/**
 * รีเซ็ตรายชื่อผู้ลงนามกลับเป็นค่าตั้งต้นของคณะ
 */
export async function resetSignatoryPresetsToDefault(actor: UserProfile): Promise<SignatoryPreset[]> {
  if (!canManageAdmin(actor)) {
    throw new Error('ไม่มีสิทธิ์จัดการรายชื่อผู้ลงนาม');
  }

  return await saveSignatoryPresets(DEFAULT_SIGNATORY_PRESETS, actor);
}
