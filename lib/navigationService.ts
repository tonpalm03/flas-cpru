import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, isConfigured } from "./firebase";
import { NavSection, NavItem, NavigationLayoutConfig } from "./navigationTypes";

export const DEFAULT_NAVIGATION_SECTIONS: NavSection[] = [
  {
    id: "sec_admin",
    key: "admin",
    label: "งานธุรการและสารบรรณ",
    iconName: "FileText",
    orderIndex: 1,
    isBuiltIn: true,
    isVisible: true,
    subItems: [
      { id: "item_memo", title: "บันทึกข้อความ", href: "/admin/memo", isBuiltIn: true },
      { id: "item_memo_circ", title: "บันทึกข้อความ (ว)", href: "/admin/memo-circular", isBuiltIn: true },
      { id: "item_ext", title: "หนังสือภายนอก", href: "/admin/external", isBuiltIn: true },
      { id: "item_ext_circ", title: "หนังสือภายนอก (ว)", href: "/admin/external-circular", isBuiltIn: true },
      { id: "item_orders", title: "คำสั่ง", href: "/admin/orders", isBuiltIn: true },
    ]
  },
  {
    id: "sec_projects",
    key: "projects",
    label: "งานโครงการและกิจกรรม",
    iconName: "FolderKanban",
    orderIndex: 2,
    isBuiltIn: true,
    isVisible: true,
    subItems: [
      { id: "item_projects_main", title: "ภาพรวมโครงการและกิจกรรม", href: "/projects", isBuiltIn: true }
    ]
  },
  {
    id: "sec_finance",
    key: "finance",
    label: "งานการเงินและงบประมาณ",
    iconName: "Wallet",
    orderIndex: 3,
    isBuiltIn: true,
    isVisible: true,
    subItems: [
      { id: "item_finance_main", title: "ภาพรวมการเงินและงบประมาณ", href: "/finance", isBuiltIn: true }
    ]
  },
  {
    id: "sec_procurement",
    key: "procurement",
    label: "งานพัสดุและจัดซื้อ",
    iconName: "Package",
    orderIndex: 4,
    isBuiltIn: true,
    isVisible: true,
    subItems: [
      { id: "item_procurement_main", title: "ภาพรวมพัสดุและจัดซื้อ", href: "/procurement", isBuiltIn: true }
    ]
  },
  {
    id: "sec_hr",
    key: "hr",
    label: "งานบริหารงานบุคคล",
    iconName: "Users",
    orderIndex: 5,
    isBuiltIn: true,
    isVisible: true,
    subItems: [
      { id: "item_hr_main", title: "ภาพรวมบริหารงานบุคคล", href: "/hr", isBuiltIn: true }
    ]
  },
  {
    id: "sec_settings",
    key: "settings",
    label: "ตั้งค่าระบบและโครงสร้าง",
    iconName: "Settings",
    orderIndex: 6,
    isBuiltIn: true,
    isVisible: true,
    subItems: [
      { id: "item_profile", title: "ข้อมูลส่วนตัว (Profile)", href: "/account/profile", isBuiltIn: true },
      { id: "item_users", title: "จัดการบัญชีผู้ใช้ & สิทธิ์", href: "/settings/users", isBuiltIn: true },
      { id: "item_workflows", title: "ขั้นตอนงาน & กำหนดสิทธิ์", href: "/settings/workflows", isBuiltIn: true }
    ]
  }
];

const STORAGE_KEY = "flas_sidebar_layout_v2";
const NAVIGATION_DOC_REF = { collection: "system_navigation", doc: "sidebar_layout" };

// Helper to filter out deprecated Studio routes from cached or persisted layout
export function sanitizeNavSections(sections: NavSection[]): NavSection[] {
  const deprecatedHrefs = new Set(["/admin/studio", "/settings/navigation"]);
  return sections.map((sec) => ({
    ...sec,
    subItems: (sec.subItems || []).filter((item) => !deprecatedHrefs.has(item.href))
  }));
}

// Event dispatcher for instant cross-component updates
export function notifyNavigationChanged(sections: NavSection[]) {
  const sanitized = sanitizeNavSections(sections);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      window.dispatchEvent(new CustomEvent("flas_navigation_updated", { detail: sanitized }));
    } catch {
      // Ignore localStorage errors
    }
  }
}

// Load navigation layout (Cached First + Firestore Fallback)
export async function getNavigationLayout(): Promise<NavSection[]> {
  if (typeof window !== "undefined") {
    try {
      const cached = window.localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Trigger async refresh in background
          refreshFromFirestoreInBackground();
          return sanitizeNavSections(parsed);
        }
      }
    } catch {
      // Fallback
    }
  }

  // Load from Firestore
  try {
    if (isConfigured && db) {
      const docRef = doc(db, NAVIGATION_DOC_REF.collection, NAVIGATION_DOC_REF.doc);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as NavigationLayoutConfig;
        if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
          const sanitized = sanitizeNavSections(data.sections);
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
            } catch {}
          }
          return sanitized;
        }
      }
    }
  } catch (error) {
    console.warn("Could not load navigation layout from Firestore, falling back to defaults", error);
  }

  // Default fallback
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NAVIGATION_SECTIONS));
    } catch {}
  }
  return DEFAULT_NAVIGATION_SECTIONS;
}

// Background sync from Firestore without blocking UI
async function refreshFromFirestoreInBackground() {
  if (!isConfigured || !db) return;
  try {
    const docRef = doc(db, NAVIGATION_DOC_REF.collection, NAVIGATION_DOC_REF.doc);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as NavigationLayoutConfig;
      if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
        if (typeof window !== "undefined") {
          const currentCached = window.localStorage.getItem(STORAGE_KEY);
          if (currentCached !== JSON.stringify(data.sections)) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.sections));
            window.dispatchEvent(new CustomEvent("flas_navigation_updated", { detail: data.sections }));
          }
        }
      }
    }
  } catch {}
}

// Save complete navigation layout
export async function saveNavigationLayout(sections: NavSection[], updatedBy?: string): Promise<void> {
  const config: NavigationLayoutConfig = {
    version: Date.now(),
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || "admin",
    sections
  };

  // 1. Instant LocalStorage update & broadcast
  notifyNavigationChanged(sections);

  // 2. Cloud Firestore persistence
  if (isConfigured && db) {
    try {
      const docRef = doc(db, NAVIGATION_DOC_REF.collection, NAVIGATION_DOC_REF.doc);
      await setDoc(docRef, {
        ...config,
        serverUpdatedAt: serverTimestamp()
      });
    } catch (error: any) {
      console.warn("Firestore persistence notice (saved to local storage):", error?.message || error);
    }
  }
}

// Reset navigation layout to factory defaults
export async function resetNavigationLayout(updatedBy?: string): Promise<NavSection[]> {
  const defaultClone: NavSection[] = JSON.parse(JSON.stringify(DEFAULT_NAVIGATION_SECTIONS));
  await saveNavigationLayout(defaultClone, updatedBy);
  return defaultClone;
}

// Helper: Add a new module / section
export async function addNavSection(
  section: Omit<NavSection, "id">,
  updatedBy?: string
): Promise<NavSection[]> {
  const current = await getNavigationLayout();
  const newSection: NavSection = {
    ...section,
    id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    orderIndex: current.length + 1
  };
  const updated = [...current, newSection];
  await saveNavigationLayout(updated, updatedBy);
  return updated;
}

// Helper: Update a section
export async function updateNavSection(
  sectionId: string,
  updates: Partial<NavSection>,
  updatedBy?: string
): Promise<NavSection[]> {
  const current = await getNavigationLayout();
  const updated = current.map((sec) => (sec.id === sectionId ? { ...sec, ...updates } : sec));
  await saveNavigationLayout(updated, updatedBy);
  return updated;
}

// Helper: Delete a section
export async function deleteNavSection(sectionId: string, updatedBy?: string): Promise<NavSection[]> {
  const current = await getNavigationLayout();
  const updated = current.filter((sec) => sec.id !== sectionId);
  await saveNavigationLayout(updated, updatedBy);
  return updated;
}

// Helper: Add a subitem to a section
export async function addNavItem(
  sectionId: string,
  item: Omit<NavItem, "id">,
  updatedBy?: string
): Promise<NavSection[]> {
  const current = await getNavigationLayout();
  const newItem: NavItem = {
    ...item,
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  };

  const updated = current.map((sec) => {
    if (sec.id === sectionId) {
      return {
        ...sec,
        subItems: [...(sec.subItems || []), newItem]
      };
    }
    return sec;
  });

  await saveNavigationLayout(updated, updatedBy);
  return updated;
}

// Helper: Move a subitem across modules or reorder
export async function moveNavItem(
  fromSectionId: string,
  toSectionId: string,
  itemId: string,
  targetIndex?: number,
  updatedBy?: string
): Promise<NavSection[]> {
  const current = await getNavigationLayout();
  let targetItem: NavItem | undefined;

  // 1. Remove from source
  const cleaned = current.map((sec) => {
    if (sec.id === fromSectionId) {
      const found = sec.subItems.find((it) => it.id === itemId);
      if (found) targetItem = found;
      return {
        ...sec,
        subItems: sec.subItems.filter((it) => it.id !== itemId)
      };
    }
    return sec;
  });

  if (!targetItem) return current;

  // 2. Insert into destination
  const updated = cleaned.map((sec) => {
    if (sec.id === toSectionId) {
      const items = [...(sec.subItems || [])];
      if (typeof targetIndex === "number" && targetIndex >= 0 && targetIndex <= items.length) {
        items.splice(targetIndex, 0, targetItem!);
      } else {
        items.push(targetItem!);
      }
      return { ...sec, subItems: items };
    }
    return sec;
  });

  await saveNavigationLayout(updated, updatedBy);
  return updated;
}
