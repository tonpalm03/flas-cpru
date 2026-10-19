import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, isConfigured } from './firebase';

/**
 * ที่เก็บข้อมูลกลางของโมดูลธุรการ: อ่านแคชในเครื่องก่อน แล้วรวมกับ Firestore
 * ประมวลผลฝั่งผู้ใช้ทั้งหมดและแคชใน localStorage เพื่อลดจำนวนการอ่านตามหลักไม่เสียค่าคลาวด์
 */
export interface StoredItem {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ModuleStore<T extends StoredItem> {
  list(): Promise<T[]>;
  cached(): T[];
  save(item: T): Promise<T>;
  remove(id: string): Promise<void>;
}

/** รอคลาวด์ไม่เกิน ms แล้วไปต่อ ข้อมูลถูกเก็บในเครื่องแล้ว จึงไม่ให้หน้าจอค้างเมื่อเครือข่ายช้า */
const settleWithin = (p: Promise<unknown>, ms = 2000) =>
  Promise.race([p.then(() => undefined), new Promise<void>(resolve => setTimeout(resolve, ms))]);

const newerOf = <T extends StoredItem>(a: T, b: T) =>
  new Date(b.updatedAt || b.createdAt || 0).getTime() >= new Date(a.updatedAt || a.createdAt || 0).getTime() ? b : a;

export function mergeItems<T extends StoredItem>(local: T[], cloud: T[], deleted: Set<string>): T[] {
  const map = new Map<string, T>();
  local.forEach(i => map.set(i.id, i));
  cloud.forEach(i => {
    const existing = map.get(i.id);
    map.set(i.id, existing ? newerOf(existing, i) : i);
  });
  return Array.from(map.values()).filter(i => !deleted.has(i.id));
}

export function createModuleStore<T extends StoredItem>(collectionName: string, cacheKey: string): ModuleStore<T> {
  const deletedKey = `${cacheKey}_deleted`;

  const read = <V,>(key: string, fallback: V): V => {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as V;
    } catch {}
    return fallback;
  };
  const write = (key: string, value: unknown) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  };

  const deletedIds = () => new Set<string>(read<string[]>(deletedKey, []));
  const cached = () => {
    const deleted = deletedIds();
    return read<T[]>(cacheKey, []).filter(i => !deleted.has(i.id));
  };

  return {
    cached,
    async list() {
      const local = cached();
      if (!isConfigured || !db) return local;
      try {
        const snap = await Promise.race([
          getDocs(collection(db, collectionName)),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
        const cloud = snap.docs.map(d => ({ ...d.data(), id: d.id }) as T);
        const merged = mergeItems(local, cloud, deletedIds());
        write(cacheKey, merged);
        return merged;
      } catch (err) {
        console.warn(`${collectionName}: ใช้ข้อมูลแคชในเครื่อง`, err);
        return local;
      }
    },
    async save(item) {
      const saved = { ...item, updatedAt: new Date().toISOString() } as T;
      const others = cached().filter(i => i.id !== saved.id);
      write(cacheKey, [saved, ...others]);
      if (isConfigured && db) {
        try {
          // Firestore ไม่รับค่า undefined
          await settleWithin(setDoc(doc(db, collectionName, saved.id), JSON.parse(JSON.stringify(saved))));
        } catch (err) {
          console.warn(`${collectionName}: บันทึกขึ้นคลาวด์ไม่สำเร็จ`, err);
        }
      }
      return saved;
    },
    async remove(id) {
      const deleted = deletedIds();
      deleted.add(id);
      write(deletedKey, Array.from(deleted));
      write(cacheKey, read<T[]>(cacheKey, []).filter(i => i.id !== id));
      if (isConfigured && db) {
        try {
          await settleWithin(deleteDoc(doc(db, collectionName, id)));
        } catch (err) {
          console.warn(`${collectionName}: ลบบนคลาวด์ไม่สำเร็จ`, err);
        }
      }
    }
  };
}

export const newItemId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
