"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRole } from './RoleContext';
import type { 
  AdminDocCategory, 
  AdminDocRegistryRecord, 
  AdminDocCategoryConfig, 
  AdminDocAction,
  DocumentWorkflowConfig,
  SequentialSignerStep
} from '@/lib/types';
import { 
  ADMIN_ACTIONS, 
  bangkokDate, 
  canManageAdmin, 
  csvCell, 
  registryNumber 
} from '@/lib/adminRegistryModel';
import { 
  getAdminDocRegistry, 
  saveAdminRecord, 
  removeAdminRecord, 
  issueAdminDocNumber,
  uploadAdminAttachment, 
  removeAdminAttachment 
} from '@/lib/adminRegistryService';
import { getCategoryById } from '@/lib/adminCategoryService';
import { 
  documentHtml, 
  openDocument, 
  exportAdminPdf, 
  exportAdminWord,
  getDisplayDocNumber,
  formatDocDigits
} from '@/lib/adminDocument';
import {
  getWorkflowConfig,
  canUserCreateDoc,
  canUserViewDoc,
  canUserEditContent,
  canUserIssueDocNumber,
  canUserSubmitToSign,
  canUserSign,
  canUserDeleteDoc,
  canUserDownloadWord,
  canUserDownloadPdf
} from '@/lib/workflowPermissionService';
import CategoryDocEditor from './CategoryDocEditor';
import { 
  Sliders, 
  ArrowLeft, 
  Eye, 
  Printer, 
  Plus, 
  CheckCircle2, 
  Send, 
  Trash2, 
  Edit3, 
  Lock, 
  PenLine, 
  Paperclip, 
  Save, 
  X, 
  FileText, 
  AlertCircle,
  Hash,
  User,
  ShieldCheck,
  RotateCcw,
  Check
} from 'lucide-react';

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none';
const buttonClass = 'rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-all disabled:opacity-40 shadow-xs inline-flex items-center justify-center gap-1.5';

export default function AdminRegistryTable({ 
  category, 
  categoryTitle, 
  categorySubtitle 
}: {
  category: AdminDocCategory;
  categoryTitle: string;
  categorySubtitle: string;
  badgeColor?: string;
}) {
  const { currentUser, isAdmin } = useRole();
  const [year, setYear] = useState(2569);
  const [records, setRecords] = useState<AdminDocRegistryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [viewScope, setViewScope] = useState<'all' | 'mine'>('all');
  
  const [preview, setPreview] = useState<AdminDocRegistryRecord | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdminDocRegistryRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [catConfig, setCatConfig] = useState<AdminDocCategoryConfig | null>(null);
  const [workflowConfig, setWorkflowConfig] = useState<DocumentWorkflowConfig | null>(null);


  // Load category settings and workflow configuration
  useEffect(() => {
    getCategoryById(category).then(cfg => {
      if (cfg) setCatConfig(cfg);
    }).catch(() => {});

    getWorkflowConfig(category).then(wf => {
      if (wf) setWorkflowConfig(wf);
    }).catch(() => {});
  }, [category]);

  async function load(targetYear?: number) {
    setLoading(true);
    setError('');
    const effectiveYear = targetYear ?? year;
    try {
      const data = await getAdminDocRegistry(category, effectiveYear, currentUser);
      setRecords(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [category, year, currentUser]);

  const years = useMemo(() => {
    const set = new Set<number>([2568, 2569, 2570]);
    records.forEach(r => set.add(r.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [records]);

  const [justSavedDoc, setJustSavedDoc] = useState<AdminDocRegistryRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter(r => {
      // My documents filter (matched by user id, email, or name)
      if (viewScope === 'mine' && currentUser) {
        const isMyDoc = r.createdById === currentUser.id ||
                        (currentUser.email && (r.createdById === currentUser.email || r.createdByEmail === currentUser.email)) ||
                        r.createdByName === currentUser.name;
        if (!isMyDoc) return false;
      }

      // Status filter
      const matchStatus = status === 'all' || r.action === status;
      if (!matchStatus) return false;

      if (!q) return true;
      return (
        (r.docNumber || '').toLowerCase().includes(q) ||
        (r.subject || '').toLowerCase().includes(q) ||
        (r.from || '').toLowerCase().includes(q) ||
        (r.to || '').toLowerCase().includes(q) ||
        (r.remarks || '').toLowerCase().includes(q) ||
        (r.signatoryName || '').toLowerCase().includes(q) ||
        (r.createdByName || '').toLowerCase().includes(q)
      );
    });
  }, [records, search, status, viewScope, currentUser]);

  function exportCsv() {
    if (!filtered.length) return;
    const headers = ['ลำดับ', 'เลขที่หนังสือ', 'วันที่', 'จาก', 'ถึง', 'เรื่อง', 'สถานะ', 'ผู้ลงนาม', 'ผู้สร้าง', 'หมายเหตุ'];
    const rows = filtered.map(r => [
      csvCell(r.sequenceNumber || ''),
      csvCell(r.docNumber || 'รอออกเลขหนังสือ'),
      csvCell(r.date),
      csvCell(r.from),
      csvCell(r.to),
      csvCell(r.subject),
      csvCell(r.action),
      csvCell(r.signatoryName || ''),
      csvCell(r.createdByName || ''),
      csvCell(r.remarks || '')
    ]);
    const content = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ทะเบียน_${categoryTitle}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function start(item?: AdminDocRegistryRecord) {
    setEditingRecord(item || null);
    setIsEditorOpen(true);
  }

  async function handleSaveRecordFromEditor(
    recordData: AdminDocRegistryRecord,
    file: File | null,
    removeFile: boolean
  ) {
    if (!currentUser) return;
    setBusy(true);
    try {
      const clientOpId = crypto.randomUUID();

      if (file) {
        const uploaded = await uploadAdminAttachment(file, currentUser);
        recordData.filePath = uploaded.filePath;
        recordData.fileUrl = uploaded.fileUrl;
        recordData.fileName = uploaded.fileName;
      } else if (removeFile && editingRecord?.filePath) {
        await removeAdminAttachment(editingRecord.filePath);
        recordData.filePath = undefined;
        recordData.fileUrl = undefined;
        recordData.fileName = undefined;
      }

      const saved = await saveAdminRecord(recordData, currentUser, clientOpId, editingRecord || undefined);
      
      // Auto-align filter year & status so user immediately sees newly saved doc
      if (saved.year && saved.year !== year) {
        setYear(saved.year);
      }
      if (status !== 'all' && status !== saved.action) {
        setStatus('all');
      }
      if (search) {
        setSearch('');
      }

      setJustSavedDoc(saved);
      setNotice(`บันทึกเอกสารเรื่อง "${saved.subject}" เรียบร้อยแล้ว (สถานะ: ${saved.action})`);
      setIsEditorOpen(false);
      setEditingRecord(null);
      await load(saved.year);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกเอกสาร');
      throw err;
    } finally {
      setBusy(false);
    }
  }

  // ส่งตรวจจากฉบับร่าง (Submit to Review from Draft)
  async function handleSendToReview(r: AdminDocRegistryRecord) {
    if (!currentUser || busy) return;
    setBusy(true);
    try {
      const clientOpId = crypto.randomUUID();
      const updated: AdminDocRegistryRecord = {
        ...r,
        action: 'รอตรวจ'
      };
      const saved = await saveAdminRecord(updated, currentUser, clientOpId, r);
      setNotice(`ส่งเอกสารเรื่อง "${saved.subject}" เข้าสู่ขั้นตอนรอตรวจเรียบร้อยแล้ว`);
      await load(saved.year);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถส่งตรวจได้');
    } finally {
      setBusy(false);
    }
  }

  // ออกเลขหนังสือ (Issue Document Number)
  async function handleIssueDocNumber(r: AdminDocRegistryRecord) {
    if (!currentUser || busy) return;
    if (!confirm(`ยืนยันการออกเลขทะเบียนคุมอย่างเป็นทางการสำหรับ "${r.subject}" หรือไม่?`)) return;

    setBusy(true);
    try {
      const updated = await issueAdminDocNumber(r.id, currentUser, catConfig?.numberingPattern);
      setNotice(`ออกเลขหนังสือ ${updated.docNumber} เรียบร้อยแล้ว`);
      if (preview?.id === r.id) setPreview(updated);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // ส่งลงนาม (Send to Sign)
  async function handleSendToSign(r: AdminDocRegistryRecord) {
    if (!currentUser || busy) return;

    // Must issue number first if not yet issued
    let currentRecord = r;
    if (!r.isNumberIssued || !r.docNumber) {
      if (confirm(`เอกสารนี้ยังไม่ได้ออกเลขหนังสือ คุณต้องการให้ออกเลขหนังสืออัตโนมัติพร้อมส่งลงนามหรือไม่?`)) {
        setBusy(true);
        try {
          currentRecord = await issueAdminDocNumber(r.id, currentUser, catConfig?.numberingPattern);
        } catch (e: any) {
          setError(e.message);
          setBusy(false);
          return;
        }
      } else {
        return;
      }
    }

    if (!confirm(`ยืนยันส่งเอกสาร ${currentRecord.docNumber || currentRecord.subject} เข้าสู่ขั้นตอน "รอลงนาม" หรือไม่? (ระบบจะล็อคไฟล์ Word)`)) return;

    setBusy(true);
    try {
      const updatedRecord: AdminDocRegistryRecord = {
        ...currentRecord,
        action: 'รอลงนาม'
      };
      await saveAdminRecord(updatedRecord, currentUser, crypto.randomUUID(), currentRecord);
      setNotice(`ส่งเอกสาร ${updatedRecord.docNumber} ให้ผู้บริหารลงนามเรียบร้อยแล้ว`);
      if (preview?.id === r.id) setPreview(updatedRecord);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // ลงนามดิจิทัล e-Signature
  async function handleSign(r: AdminDocRegistryRecord) {
    if (!currentUser || busy) return;
    
    let confirmText = `ยืนยันลงนามอิเล็กทรอนิกส์ (e-Signature) ในเอกสาร ${r.docNumber || r.subject} ในนาม "${currentUser.name}" (${currentUser.position || 'ผู้ลงนาม'}) ใช่หรือไม่?`;
    if (!currentUser.signatureUrl) {
      confirmText += `\n\nหมายเหตุ: ท่านยังไม่ได้อัปโหลดรูปลายเซ็นโปร่งใสไว้ในระบบ (ตั้งค่าได้ที่หน้า "ตั้งค่า > ข้อมูลส่วนตัว") ระบบจะประทับชื่อและวันที่ดิจิทัลให้`;
    }

    if (!confirm(confirmText)) return;

    setBusy(true);
    try {
      const updatedRecord: AdminDocRegistryRecord = {
        ...r,
        action: 'ลงนามแล้ว',
        signatureUrl: currentUser.signatureUrl || r.signatureUrl,
        signedAt: bangkokDate(),
        signedById: currentUser.id,
        signedByName: currentUser.name,
        signedByPosition: currentUser.position || r.signatoryPosition || ''
      };

      await saveAdminRecord(updatedRecord, currentUser, crypto.randomUUID(), r);
      setNotice(`ลงนามอิเล็กทรอนิกส์ในเอกสาร ${r.docNumber || r.subject} เรียบร้อยแล้ว`);
      if (preview?.id === r.id) setPreview(updatedRecord);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // ลบเอกสาร
  async function remove(r: AdminDocRegistryRecord) {
    const docDisplay = r.docNumber || r.subject;
    if (!currentUser || !confirm(`ลบ "${docDisplay}" ออกจากระบบถาวรใช่หรือไม่?`)) return;
    setBusy(true);
    let failure = '';
    try {
      await removeAdminRecord(r, currentUser);
      setNotice('ลบรายการเรียบร้อยแล้ว');
      if (preview?.id === r.id) setPreview(null);
    } catch (e: any) {
      failure = e.message;
    } finally {
      await load();
      if (failure) setError(failure);
      setBusy(false);
    }
  }

  async function handleExportWord(r: AdminDocRegistryRecord) {
    if (r.action === 'รอลงนาม') {
      alert('เอกสารนี้อยู่ในขั้นตอน "รอลงนาม" ไม่อนุญาตให้ดาวน์โหลด Word เพื่อป้องกันการแก้ไขก่อนลงนาม (กรุณาดูหรือพิมพ์เป็น PDF)');
      return;
    }
    setBusy(true);
    try {
      await exportAdminWord(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function handleExportPdf(r: AdminDocRegistryRecord) {
    try {
      exportAdminPdf(r);
    } catch (e: any) {
      setError(e.message);
    }
  }

  function renderStatusBadge(action: AdminDocAction | string, isNumberIssued = false) {
    switch (action) {
      case 'ฉบับร่าง':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            ฉบับร่าง
          </span>
        );
      case 'รอตรวจ':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            1. รอตรวจ
          </span>
        );
      case 'รอลงนาม':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
            2. รอลงนาม
          </span>
        );
      case 'ลงนามแล้ว':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            3. ลงนามแล้ว
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
            {action}
          </span>
        );
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link className="text-xs text-blue-900 font-semibold hover:underline flex items-center gap-1 mb-1.5" href="/admin">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับศูนย์ธุรการ
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{categoryTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{categorySubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          {isAdmin && (
            <>
              <Link
                href="/admin/studio"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 text-xs font-semibold border border-blue-200/80 shadow-xs transition-all"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-800" />
                <span>จัดการแม่แบบ (Studio)</span>
              </Link>
              <Link
                href="/settings/workflows"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 text-xs font-semibold border border-purple-200/80 shadow-xs transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                <span>กำหนดสิทธิ์ & ขั้นตอนงาน</span>
              </Link>
            </>
          )}

        </div>
      </div>

      {/* 3-Step Lifecycle Visual Info Bar */}
      <div className="grid sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-emerald-50/70 border border-slate-200 text-xs">
        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/80 border border-amber-200/80 shadow-xs">
          <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</div>
          <div>
            <div className="font-bold text-amber-950">รอตรวจ (Pending Review)</div>
            <p className="text-[11px] text-slate-600 mt-0.5">ผู้สร้างส่งเรื่อง &rarr; ผู้ตรวจตรวจทานและออกเลขทะเบียน (ไม่ผ่านลบได้ทันที)</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/80 border border-indigo-200/80 shadow-xs">
          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</div>
          <div>
            <div className="font-bold text-indigo-950">รอลงนาม (Pending Sign)</div>
            <p className="text-[11px] text-slate-600 mt-0.5">ผู้ลงนามตรวจ PDF และกดปั๊ม e-Signature (ล็อค Word ป้องกันแก้ไขก่อนลงนาม)</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/80 border border-emerald-200/80 shadow-xs">
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</div>
          <div>
            <div className="font-bold text-emerald-950">ลงนามแล้ว (Signed)</div>
            <p className="text-[11px] text-slate-600 mt-0.5">เอกสารประทับลายเซ็นดิจิทัลสมบูรณ์ ดาวน์โหลด Word / PDF และส่งต่อ</p>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-rose-50 text-rose-800 border border-rose-200 p-4 rounded-xl text-xs flex items-center justify-between gap-2">
          <span>{error}</span>
          <button className="underline font-bold" onClick={() => load()}>ลองใหม่</button>
        </div>
      )}

      {notice && (
        <div role="status" className="text-emerald-800 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs font-semibold flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          {justSavedDoc && (
            <button
              type="button"
              onClick={() => {
                setPreview(justSavedDoc);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition text-xs font-semibold shrink-0 cursor-pointer shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>เปิดดูเอกสารที่เพิ่งสร้าง</span>
            </button>
          )}
        </div>
      )}

      {/* Scope, Filter, and Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Scope Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setViewScope('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewScope === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทะเบียนทั้งหมด ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setViewScope('mine')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
              viewScope === 'mine'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-700" />
            <span>เรื่องของฉัน</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
          <select aria-label="ปีทะเบียน" className={buttonClass} value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>ปี พ.ศ. {y}</option>)}
          </select>

          <input
            aria-label="ค้นหาทะเบียน"
            className={inputClass + ' max-w-[240px] !py-1.5 text-xs'}
            placeholder="ค้นหาเลขที่, เรื่อง, ผู้ส่ง..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select aria-label="สถานะ" className={buttonClass} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">ทุกสถานะ</option>
            {ADMIN_ACTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <button className={buttonClass} disabled={loading} onClick={() => load()}>รีเฟรช</button>
          <button className={buttonClass} disabled={!filtered.length} onClick={exportCsv}>ส่งออก CSV ({filtered.length})</button>

          {/* Create Doc Button (ANY role can create) */}
          <button 
            className={buttonClass + ' !bg-blue-900 hover:!bg-blue-800 text-white shadow-sm'} 
            onClick={() => start()}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1" /> ร่างเอกสารใหม่
          </button>
        </div>
      </div>

      {/* Registry Records Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              {['เลขทะเบียน / ที่', 'วันที่', 'จาก / ถึง', 'เรื่อง', 'สถานะ', 'การปฏิบัติ / จัดการ'].map(h => (
                <th className="p-3.5 text-left whitespace-nowrap" key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="p-12 text-center text-slate-400">กำลังโหลดสมุดทะเบียน...</td></tr>
            ) : !filtered.length ? (
              <tr><td colSpan={6} className="p-12 text-center text-slate-400">{error ? 'ยังโหลดข้อมูลไม่ได้' : 'ยังไม่มีรายการทะเบียนในเงื่อนไขนี้'}</td></tr>
            ) : filtered.map(r => {
              const isLockedForSign = r.action === 'รอลงนาม';
              const canEditThis = canUserEditContent(currentUser, r, workflowConfig || undefined);
              const canIssueNum = canUserIssueDocNumber(currentUser, r, workflowConfig || undefined);
              const canSubmitSign = canUserSubmitToSign(currentUser, r, workflowConfig || undefined);
              const canSignThis = canUserSign(currentUser, r, workflowConfig || undefined);
              const canDeleteThis = canUserDeleteDoc(currentUser, r, workflowConfig || undefined);
              const canWord = canUserDownloadWord(currentUser, r, workflowConfig || undefined);
              const canPdf = canUserDownloadPdf(currentUser, r, workflowConfig || undefined);

              return (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors align-top">
                  <td className="p-3.5">
                    {r.isNumberIssued && r.sequenceNumber > 0 ? (
                      <>
                        <div className="font-bold text-slate-900 font-mono text-sm">{r.sequenceNumber}</div>
                        <div className="font-medium text-slate-700 whitespace-nowrap">{r.docNumber}</div>
                      </>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                        <Hash className="w-3 h-3 text-amber-600" /> รอออกเลข
                      </div>
                    )}
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {r.digitType === 'arabic' ? 'เลขอารบิก' : 'เลขไทย'}
                    </span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap text-slate-600">{r.date}</td>
                  <td className="p-3.5 min-w-[180px]">
                    <div className="font-medium text-slate-900">{r.from}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">ถึง {r.to}</div>
                    <div className="text-slate-400 text-[10px] mt-1">ผู้สร้าง: {r.createdByName || 'ผู้ใช้งาน'}</div>
                  </td>
                  <td className="p-3.5 min-w-[220px]">
                    <div className="font-medium text-slate-800">{r.subject}</div>
                    {r.signatureUrl && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium text-[10px] mt-1 border border-emerald-200">
                        <PenLine className="w-3 h-3 text-emerald-700" /> มีลายเซ็น e-Signature
                      </div>
                    )}
                    {r.fileUrl && (
                      <a href={r.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-800 font-medium underline mt-1.5 text-[11px] block">
                        <Paperclip className="w-3 h-3 text-blue-700" /> {r.fileName || 'ไฟล์เอกสารแนบ'}
                      </a>
                    )}
                  </td>
                  <td className="p-3.5">
                    {renderStatusBadge(r.action, r.isNumberIssued)}
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1.5 min-w-[240px]">
                      {/* View Button */}
                      <button className={buttonClass} onClick={() => setPreview(r)}>
                        <Eye className="w-3.5 h-3.5 text-blue-900" /> ดูเอกสาร
                      </button>

                      {/* Word Export: Locked during 'รอลงนาม' */}
                      {isLockedForSign ? (
                        <button
                          className={buttonClass + ' opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'}
                          title="ล็อคห้ามโหลด Word ในขั้นรอลงนาม เพื่อป้องกันการแก้ไขก่อนลงนาม (กรุณาดูหรือพิมพ์เป็น PDF เท่านั้น)"
                          onClick={() => handleExportWord(r)}
                        >
                          <Lock className="w-3 h-3 text-slate-400" /> Word
                        </button>
                      ) : (
                        <button className={buttonClass} disabled={busy || !canWord} onClick={() => handleExportWord(r)}>
                          Word
                        </button>
                      )}

                      <button className={buttonClass + ' text-rose-700 hover:bg-rose-50'} disabled={busy || !canPdf} onClick={() => handleExportPdf(r)}>
                        PDF
                      </button>

                      {/* Action: Send to Review from Draft */}
                      {r.action === 'ฉบับร่าง' && canEditThis && (
                        <button
                          className={buttonClass + ' !bg-blue-900 text-white hover:!bg-blue-800 shadow-xs'}
                          disabled={busy}
                          onClick={() => handleSendToReview(r)}
                          title="ส่งเอกสารเข้าสู่ขั้นตอนรอตรวจและออกเลข"
                        >
                          <Send className="w-3 h-3" /> ส่งตรวจ
                        </button>
                      )}

                      {/* Action: Issue Number */}
                      {r.action === 'รอตรวจ' && !r.isNumberIssued && canIssueNum && (
                        <button
                          className={buttonClass + ' !bg-blue-900 text-white hover:!bg-blue-800 shadow-xs'}
                          disabled={busy}
                          onClick={() => handleIssueDocNumber(r)}
                          title="ออกเลขทะเบียนคุมอย่างเป็นทางการ"
                        >
                          <Hash className="w-3 h-3" /> ออกเลข
                        </button>
                      )}

                      {/* Action: Send to Sign */}
                      {r.action === 'รอตรวจ' && canSubmitSign && (
                        <button
                          className={buttonClass + ' !bg-indigo-900 text-white hover:!bg-indigo-800 shadow-xs'}
                          disabled={busy}
                          onClick={() => handleSendToSign(r)}
                          title="ผ่านการตรวจแล้ว -> ส่งให้ผู้บริหารลงนาม"
                        >
                          <Send className="w-3 h-3" /> ส่งลงนาม
                        </button>
                      )}

                      {/* Action: Sign (e-Signature) */}
                      {r.action === 'รอลงนาม' && canSignThis && (
                        <button
                          className={buttonClass + ' !bg-emerald-900 text-white hover:!bg-emerald-800 shadow-md'}
                          disabled={busy}
                          onClick={() => handleSign(r)}
                          title="ปั๊ม e-Signature ลายเซ็นต์ดิจิทัล"
                        >
                          <PenLine className="w-3 h-3 inline mr-1" /> ลงนาม (e-Sign)
                        </button>
                      )}

                      {/* Action: Edit Content */}
                      {canEditThis && (
                        <button className={buttonClass} disabled={busy} onClick={() => start(r)}>
                          <Edit3 className="w-3 h-3 text-slate-600" /> {r.action === 'รอตรวจ' ? 'ตรวจแก้' : 'แก้ไข'}
                        </button>
                      )}

                      {/* Action: Delete */}
                      {canDeleteThis && (
                        <button
                          className={buttonClass + ' text-rose-600 hover:bg-rose-50'}
                          disabled={busy}
                          onClick={() => remove(r)}
                          title="ลบเอกสาร"
                        >
                          <Trash2 className="w-3 h-3" /> ลบ
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Category-Specific Document Editor with Live Fixed-Template Preview */}
      {isEditorOpen && (
        <CategoryDocEditor
          category={category}
          categoryTitle={categoryTitle}
          categorySubtitle={categorySubtitle}
          catConfig={catConfig}
          initialRecord={editingRecord}
          year={year}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onSave={handleSaveRecordFromEditor}
          onCancel={() => {
            setIsEditorOpen(false);
            setEditingRecord(null);
          }}
        />
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto p-4 flex justify-center">
          <section role="dialog" aria-modal="true" aria-label="ดูเอกสาร" className="max-w-4xl w-full bg-white rounded-3xl p-6 sm:p-8 my-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  พรีวิวเอกสาร: {preview.docNumber || preview.subject}
                </h2>
                <p className="text-xs text-slate-500">
                  สถานะ: {preview.action} • ผู้สร้าง: {preview.createdByName || 'ผู้ใช้งาน'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={buttonClass + ' text-rose-700 hover:bg-rose-50'}
                  onClick={() => handleExportPdf(preview)}
                >
                  <Printer className="w-3.5 h-3.5" /> พิมพ์ / PDF
                </button>

                {preview.action !== 'รอลงนาม' && (
                  <button
                    className={buttonClass}
                    onClick={() => handleExportWord(preview)}
                  >
                    Word
                  </button>
                )}

                <button
                  className="text-slate-400 hover:text-slate-600 p-1"
                  onClick={() => setPreview(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Render HTML preview inside sandboxed iframe */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 p-2">
              <iframe
                title="Preview"
                srcDoc={documentHtml(preview, typeof window !== 'undefined' ? window.location.origin : '')}
                className="w-full h-[650px] bg-white rounded-xl shadow-xs"
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
