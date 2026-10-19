"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileDown, Newspaper, Pencil, Plus, Printer, Search, Send, Trash2, Undo2 } from "lucide-react";
import AdminModuleShell from "@/components/AdminModuleShell";
import RichBodyEditor from "@/components/RichBodyEditor";
import { useRole } from "@/components/RoleContext";
import {
  NEWSLETTER_CATEGORIES,
  Newsletter,
  newNewsletter,
  newsletterParts,
  newsletterStore,
  validateNewsletter,
  visibleNewsletters
} from "@/lib/newsletterService";
import { blocksToHtml, buildPartsWord, downloadBlob, openHtmlDocument, pageHtml } from "@/lib/moduleDocument";
import { getBodyBlocks, sanitizeBodyHtml } from "@/lib/richBody";
import { thaiDate } from "@/lib/adminDocument";

const inputStyle =
  "w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20";
const btn = "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors";

type Mode = { type: "list" } | { type: "read"; id: string } | { type: "edit"; draft: Newsletter };

export default function NewsletterPage() {
  const { currentUser } = useRole();
  const [items, setItems] = useState<Newsletter[]>(() => newsletterStore.cached());
  const [mode, setMode] = useState<Mode>({ type: "list" });
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    newsletterStore.list().then(list => {
      if (active) setItems(list);
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = async (item: Newsletter) => {
    const saved = await newsletterStore.save(item);
    setItems(prev => [saved, ...prev.filter(i => i.id !== saved.id)]);
    return saved;
  };

  return (
    <AdminModuleShell
      moduleKey="newsletter"
      title="ระบบจดหมายข่าว"
      subtitle="เขียนและเผยแพร่ข่าวประชาสัมพันธ์ของคณะ บุคลากรทุกคนอ่านได้ ส่งออกเป็น PDF หรือ Word"
      actions={canEdit =>
        canEdit && mode.type === "list" ? (
          <button
            type="button"
            onClick={() => setMode({ type: "edit", draft: newNewsletter({ id: currentUser?.id, name: currentUser?.name }) })}
            className={`${btn} bg-blue-900 border-blue-900 text-white hover:bg-blue-800`}
          >
            <Plus className="w-4 h-4" />
            เขียนข่าวใหม่
          </button>
        ) : null
      }
    >
      {({ canEdit }) => {
        const visible = visibleNewsletters(items, canEdit);

        if (mode.type === "edit") {
          return (
            <Editor
              draft={mode.draft}
              error={error}
              onCancel={() => {
                setError("");
                setMode({ type: "list" });
              }}
              onSave={async (n, publish) => {
                const next: Newsletter = {
                  ...n,
                  bodyHtml: sanitizeBodyHtml(n.bodyHtml),
                  status: publish ? "เผยแพร่แล้ว" : n.status === "เผยแพร่แล้ว" && !publish ? "เผยแพร่แล้ว" : "ฉบับร่าง",
                  publishedAt: publish ? n.publishedAt || new Date().toISOString() : n.publishedAt
                };
                const problem = validateNewsletter(next, publish);
                if (problem) {
                  setError(problem);
                  return;
                }
                setError("");
                const saved = await persist(next);
                setMode({ type: "read", id: saved.id });
              }}
            />
          );
        }

        if (mode.type === "read") {
          const item = items.find(i => i.id === mode.id);
          if (!item) return null;
          return (
            <Reader
              item={item}
              canEdit={canEdit}
              onBack={() => setMode({ type: "list" })}
              onEdit={() => setMode({ type: "edit", draft: item })}
              onTogglePublish={async () => {
                const publishing = item.status !== "เผยแพร่แล้ว";
                const problem = validateNewsletter(item, publishing);
                if (problem) return setError(problem);
                setError("");
                await persist({
                  ...item,
                  status: publishing ? "เผยแพร่แล้ว" : "ฉบับร่าง",
                  publishedAt: publishing ? item.publishedAt || new Date().toISOString() : item.publishedAt
                });
              }}
              onDelete={async () => {
                if (!window.confirm(`ลบข่าว "${item.title}" ใช่หรือไม่ การลบไม่สามารถย้อนกลับได้`)) return;
                await newsletterStore.remove(item.id);
                setItems(prev => prev.filter(i => i.id !== item.id));
                setMode({ type: "list" });
              }}
              error={error}
            />
          );
        }

        const q = query.trim().toLowerCase();
        const shown = q
          ? visible.filter(n => `${n.title} ${n.summary || ""} ${n.category}`.toLowerCase().includes(q))
          : visible;

        return (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className={inputStyle + " pl-9"}
                placeholder="ค้นหาหัวเรื่องหรือเนื้อหาข่าว"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            {shown.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                <Newspaper className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                {canEdit ? "ยังไม่มีข่าว กดปุ่ม \"เขียนข่าวใหม่\" เพื่อเริ่มต้น" : "ยังไม่มีข่าวที่เผยแพร่"}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {shown.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setMode({ type: "read", id: n.id })}
                    className="text-left bg-white rounded-2xl border border-slate-200 hover:border-blue-900/40 hover:shadow-sm p-4 transition-all"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-900">{n.category}</span>
                      {n.status === "ฉบับร่าง" && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">ฉบับร่าง</span>}
                      {n.issueLabel && <span className="text-slate-500">{n.issueLabel}</span>}
                    </div>
                    <h3 className="mt-2 font-bold text-slate-900 leading-snug">{n.title}</h3>
                    {n.summary && <p className="mt-1 text-sm text-slate-600 line-clamp-2">{n.summary}</p>}
                    <p className="mt-2 text-[11px] text-slate-400">
                      {thaiDate((n.publishedAt || n.createdAt).slice(0, 10))}
                      {n.createdByName ? ` | ${n.createdByName}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </AdminModuleShell>
  );
}

function Reader({
  item,
  canEdit,
  error,
  onBack,
  onEdit,
  onTogglePublish,
  onDelete
}: {
  item: Newsletter;
  canEdit: boolean;
  error: string;
  onBack: () => void;
  onEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  const parts = useMemo(() => newsletterParts(item), [item]);
  const bodyHtml = useMemo(() => blocksToHtml(getBodyBlocks(item)), [item]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onBack} className={`${btn} bg-white border-slate-200 text-slate-700 hover:bg-slate-50`}>
          <ArrowLeft className="w-4 h-4" />
          กลับรายการข่าว
        </button>
        <button
          type="button"
          onClick={() => openHtmlDocument(pageHtml(item.title, parts, window.location.origin))}
          className={`${btn} bg-white border-slate-200 text-slate-700 hover:bg-slate-50`}
        >
          <Printer className="w-4 h-4" />
          พิมพ์ / PDF
        </button>
        <button
          type="button"
          onClick={async () => downloadBlob(await buildPartsWord(parts), `${item.title || "จดหมายข่าว"}.docx`)}
          className={`${btn} bg-white border-slate-200 text-slate-700 hover:bg-slate-50`}
        >
          <FileDown className="w-4 h-4" />
          ดาวน์โหลด Word
        </button>
        {canEdit && (
          <>
            <button type="button" onClick={onEdit} className={`${btn} bg-white border-slate-200 text-slate-700 hover:bg-slate-50`}>
              <Pencil className="w-4 h-4" />
              แก้ไข
            </button>
            <button type="button" onClick={onTogglePublish} className={`${btn} bg-white border-slate-200 text-slate-700 hover:bg-slate-50`}>
              {item.status === "เผยแพร่แล้ว" ? <Undo2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {item.status === "เผยแพร่แล้ว" ? "ยกเลิกการเผยแพร่" : "เผยแพร่"}
            </button>
            <button type="button" onClick={onDelete} className={`${btn} bg-white border-rose-200 text-rose-700 hover:bg-rose-50`}>
              <Trash2 className="w-4 h-4" />
              ลบ
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <article className="bg-white rounded-2xl border border-slate-200 p-6 md:p-10 max-w-3xl">
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-900">{item.category}</span>
          <span className={`px-2 py-0.5 rounded-full ${item.status === "เผยแพร่แล้ว" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
            {item.status}
          </span>
          {item.issueLabel && <span className="text-slate-500">{item.issueLabel}</span>}
        </div>
        <h2 className="mt-3 text-2xl font-bold text-slate-900 leading-snug">{item.title}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {thaiDate((item.publishedAt || item.createdAt).slice(0, 10))}
          {item.createdByName ? ` | โดย ${item.createdByName}` : ""}
        </p>
        {item.summary && <p className="mt-4 font-semibold text-slate-800">{item.summary}</p>}
        <div
          className="mt-4 text-slate-900 leading-relaxed [&_.body-para]:mb-2"
          style={{ fontFamily: "'TH SarabunPSK','Sarabun',sans-serif", fontSize: "18px" }}
          // เนื้อหามาจากชุด HTML ที่ผ่านตัวกรองของระบบเท่านั้น (blocksToHtml)
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </article>
    </div>
  );
}

function Editor({
  draft,
  error,
  onCancel,
  onSave
}: {
  draft: Newsletter;
  error: string;
  onCancel: () => void;
  onSave: (n: Newsletter, publish: boolean) => Promise<void>;
}) {
  const [n, setN] = useState<Newsletter>(draft);
  const [busy, setBusy] = useState(false);
  const run = async (publish: boolean) => {
    setBusy(true);
    try {
      await onSave(n, publish);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 max-w-4xl">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="md:col-span-3 block">
          <span className="text-xs font-semibold text-slate-700">หัวเรื่องข่าว *</span>
          <input className={inputStyle + " mt-1"} value={n.title} onChange={e => setN({ ...n, title: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">หมวดข่าว</span>
          <select
            className={inputStyle + " mt-1"}
            value={n.category}
            onChange={e => setN({ ...n, category: e.target.value as Newsletter["category"] })}
          >
            {NEWSLETTER_CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-semibold text-slate-700">ฉบับที่ / ปีที่ (ไม่บังคับ)</span>
          <input
            className={inputStyle + " mt-1"}
            placeholder="เช่น ฉบับที่ ๓/๒๕๖๙"
            value={n.issueLabel || ""}
            onChange={e => setN({ ...n, issueLabel: e.target.value })}
          />
        </label>
        <label className="md:col-span-3 block">
          <span className="text-xs font-semibold text-slate-700">บทคัดย่อข่าว (แสดงในรายการ)</span>
          <textarea
            rows={2}
            className={inputStyle + " mt-1"}
            value={n.summary || ""}
            onChange={e => setN({ ...n, summary: e.target.value })}
          />
        </label>
      </div>
      <div>
        <span className="text-xs font-semibold text-slate-700">เนื้อหาข่าว</span>
        <div className="mt-1">
          <RichBodyEditor value={n.bodyHtml} onChange={html => setN(prev => ({ ...prev, bodyHtml: html }))} placeholder="พิมพ์เนื้อหาข่าว" />
        </div>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className={`${btn} bg-white border-slate-200 text-slate-700`}>
          ยกเลิก
        </button>
        <button type="button" onClick={() => run(false)} disabled={busy} className={`${btn} bg-white border-slate-300 text-slate-800`}>
          {n.status === "เผยแพร่แล้ว" ? "บันทึกการแก้ไข" : "บันทึกร่าง"}
        </button>
        <button type="button" onClick={() => run(true)} disabled={busy} className={`${btn} bg-blue-900 border-blue-900 text-white`}>
          <Send className="w-4 h-4" />
          เผยแพร่
        </button>
      </div>
    </div>
  );
}
