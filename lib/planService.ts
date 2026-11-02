/**
 * ระบบแผน: เก็บโครงการใน Firestore (plan_projects) พร้อมแคชในเครื่อง (localStorage)
 * การเปลี่ยนสถานะทำใน Transaction เดียว เพื่อไม่ให้สองคนตรวจโครงการเดียวกันซ้อนกัน
 */
import { collection, doc, getDoc, getDocs, query, where, runTransaction, deleteDoc } from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import type { UserProfile } from './types';
import { logAuditEvent } from './auditService';
import {
  canDeletePlan,
  canEditPlan,
  canViewAllPlans,
  canViewPlan,
  cleanPlanForm,
  decidePlanAction,
  getFiscalYearConfig,
  newId,
  planCode,
  planTotal,
  PlanWorkflowError,
  validatePlanForm,
  type PlanAction,
  type PlanForm,
  type PlanProject,
} from './planModel';

const COLLECTION = 'plan_projects';
const COUNTERS = 'plan_counters';
const CACHE_KEY = 'faculty_plan_projects_v1';
const CLOUD_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label}: หมดเวลาเชื่อมต่อ`)), CLOUD_TIMEOUT_MS)),
  ]);
}

function readCache(): PlanProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCache(list: PlanProject[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch {}
}

function cacheUpsert(project: PlanProject) {
  writeCache([project, ...readCache().filter(p => p.id !== project.id)]);
}

function cacheRemove(id: string) {
  writeCache(readCache().filter(p => p.id !== id));
}

const plain = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const byUpdated = (a: PlanProject, b: PlanProject) =>
  new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();

const cloud = () => isConfigured && !!db;

/** โครงการที่ผู้ใช้เห็นได้: ของตัวเอง หรือทั้งหมดถ้าเป็นเจ้าหน้าที่แผน/ผู้บริหาร */
export async function listPlanProjects(actor: UserProfile | null): Promise<PlanProject[]> {
  if (!actor) return [];
  let list = readCache();
  if (cloud()) {
    try {
      const ref = collection(db, COLLECTION);
      const q = canViewAllPlans(actor) ? query(ref) : query(ref, where('ownerId', '==', actor.id));
      const snap = await withTimeout(getDocs(q), 'โหลดโครงการ');
      const remote = snap.docs.map(d => ({ ...(d.data() as PlanProject), id: d.id }));
      // ของในเครื่องที่ใหม่กว่า (ยังไม่ได้ซิงก์) ไม่ถูกทับ
      const merged = new Map(list.map(p => [p.id, p]));
      for (const r of remote) {
        const local = merged.get(r.id);
        if (!local || (r.revision || 0) >= (local.revision || 0)) merged.set(r.id, r);
      }
      // โครงการที่ถูกลบจากเครื่องอื่นจะไม่อยู่ในผลจาก Cloud จึงไม่เก็บไว้ต่อ
      list = remote.map(r => merged.get(r.id) || r);
      writeCache(list);
    } catch (err) {
      console.warn('listPlanProjects: ใช้ข้อมูลในเครื่องแทน', err);
    }
  }
  return list.filter(p => canViewPlan(actor, p)).sort(byUpdated);
}

export async function getPlanProject(id: string, actor: UserProfile | null): Promise<PlanProject | null> {
  let project = readCache().find(p => p.id === id) || null;
  if (cloud()) {
    try {
      const snap = await withTimeout(getDoc(doc(db, COLLECTION, id)), 'โหลดโครงการ');
      if (snap.exists()) {
        project = { ...(snap.data() as PlanProject), id: snap.id };
        cacheUpsert(project);
      }
    } catch (err) {
      console.warn('getPlanProject: ใช้ข้อมูลในเครื่องแทน', err);
    }
  }
  if (!project || !canViewPlan(actor, project)) return null;
  return project;
}

/** บันทึกร่าง (สร้างใหม่ถ้ายังไม่มี id) — ไม่เปลี่ยนสถานะ */
export async function savePlanDraft(
  input: { id?: string; fiscalYear: number; form: PlanForm },
  actor: UserProfile
): Promise<PlanProject> {
  const now = new Date().toISOString();
  const totalAmount = planTotal(input.form);

  if (!input.id) {
    const project: PlanProject = {
      id: newId('plan'),
      fiscalYear: input.fiscalYear,
      status: 'DRAFT',
      form: input.form,
      totalAmount,
      ownerId: actor.id,
      ownerName: actor.name,
      department: input.form.department,
      history: [{ action: 'create', toStatus: 'DRAFT', byId: actor.id, byName: actor.name, at: now }],
      createdAt: now,
      updatedAt: now,
      revision: 1,
    };
    if (cloud()) {
      await withTimeout(runTransaction(db, async tx => {
        tx.set(doc(db, COLLECTION, project.id), plain(project));
      }), 'บันทึกร่าง');
    }
    cacheUpsert(project);
    await logAuditEvent(actor, 'CREATE_PLAN_PROJECT', COLLECTION, project.id, { title: input.form.title });
    return project;
  }

  const id = input.id;
  const apply = (current: PlanProject): PlanProject => {
    if (!canEditPlan(actor, current)) throw new PlanWorkflowError('โครงการนี้แก้ไขไม่ได้ในสถานะปัจจุบัน หรือคุณไม่มีสิทธิ์แก้ไข');
    return {
      ...current,
      fiscalYear: input.fiscalYear,
      form: input.form,
      totalAmount,
      department: input.form.department,
      updatedAt: now,
      revision: (current.revision || 0) + 1,
    };
  };

  let saved: PlanProject;
  if (cloud()) {
    saved = await withTimeout(runTransaction(db, async tx => {
      const ref = doc(db, COLLECTION, id);
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new PlanWorkflowError('ไม่พบโครงการนี้ในระบบ');
      const next = apply({ ...(snap.data() as PlanProject), id });
      tx.set(ref, plain(next));
      return next;
    }), 'บันทึกร่าง');
  } else {
    const current = readCache().find(p => p.id === id);
    if (!current) throw new PlanWorkflowError('ไม่พบโครงการนี้ในระบบ');
    saved = apply(current);
  }
  cacheUpsert(saved);
  return saved;
}

/**
 * ส่งตรวจ / อนุมัติ / ตีกลับ / ไม่อนุมัติ
 * ตรวจสถานะล่าสุดใน Transaction และออกเลขโครงการตอนส่งตรวจครั้งแรก
 */
export async function runPlanAction(
  id: string,
  action: PlanAction,
  actor: UserProfile,
  reason?: string
): Promise<PlanProject> {
  const now = new Date().toISOString();
  const cleanReason = String(reason || '').trim() || undefined;

  const apply = (current: PlanProject, nextSequence: () => number): PlanProject => {
    const toStatus = decidePlanAction(current, action, actor, cleanReason);
    let form = current.form;
    if (action === 'submit') {
      form = cleanPlanForm(current.form);
      const problem = validatePlanForm(form, getFiscalYearConfig(current.fiscalYear));
      if (problem) throw new PlanWorkflowError(`ข้อมูลยังไม่ครบ (ขั้นที่ ${problem.step}): ${problem.errors[0]}`);
    }
    const next: PlanProject = {
      ...current,
      form,
      totalAmount: planTotal(form),
      status: toStatus,
      code: current.code || (action === 'submit' ? planCode(current.fiscalYear, nextSequence()) : undefined),
      lastReason: cleanReason,
      updatedAt: now,
      revision: (current.revision || 0) + 1,
      history: [
        ...(current.history || []),
        { action, fromStatus: current.status, toStatus, byId: actor.id, byName: actor.name, at: now, ...(cleanReason ? { reason: cleanReason } : {}) },
      ],
    };
    if (action === 'submit') next.submittedAt = now;
    else Object.assign(next, { reviewedAt: now, reviewedById: actor.id, reviewedByName: actor.name });
    if (!next.code) delete next.code;
    if (!next.lastReason) delete next.lastReason;
    return next;
  };

  let saved: PlanProject;
  if (cloud()) {
    saved = await withTimeout(runTransaction(db, async tx => {
      const ref = doc(db, COLLECTION, id);
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new PlanWorkflowError('ไม่พบโครงการนี้ในระบบ');
      const current = { ...(snap.data() as PlanProject), id };
      const counterRef = doc(db, COUNTERS, String(current.fiscalYear));
      const counterSnap = !current.code && action === 'submit' ? await tx.get(counterRef) : null;
      let sequence = 0;
      const next = apply(current, () => {
        sequence = ((counterSnap?.data()?.last as number) || 0) + 1;
        return sequence;
      });
      if (sequence) tx.set(counterRef, { last: sequence, updatedAt: now }, { merge: true });
      tx.set(ref, plain(next));
      return next;
    }), PLAN_ACTION_TITLE[action]);
  } else {
    const list = readCache();
    const current = list.find(p => p.id === id);
    if (!current) throw new PlanWorkflowError('ไม่พบโครงการนี้ในระบบ');
    saved = apply(current, () => list.filter(p => p.fiscalYear === current.fiscalYear && p.code).length + 1);
  }
  cacheUpsert(saved);
  await logAuditEvent(actor, `PLAN_${action.toUpperCase()}`, COLLECTION, id, { code: saved.code, status: saved.status, reason: cleanReason });
  return saved;
}

const PLAN_ACTION_TITLE: Record<PlanAction, string> = {
  submit: 'ส่งตรวจ',
  approve: 'อนุมัติ',
  request_revision: 'ตีกลับ',
  reject: 'ไม่อนุมัติ',
};

export async function deletePlanProject(project: PlanProject, actor: UserProfile): Promise<void> {
  if (!canDeletePlan(actor, project)) throw new PlanWorkflowError('คุณไม่มีสิทธิ์ลบโครงการนี้');
  if (cloud()) await withTimeout(deleteDoc(doc(db, COLLECTION, project.id)), 'ลบโครงการ');
  cacheRemove(project.id);
  await logAuditEvent(actor, 'DELETE_PLAN_PROJECT', COLLECTION, project.id, { code: project.code, title: project.form.title });
}
