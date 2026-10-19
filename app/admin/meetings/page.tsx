"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, CalendarDays, FileDown, ListPlus, MapPin, Pencil, Plus, Printer, Trash2, Users } from "lucide-react";
import AdminModuleShell from "@/components/AdminModuleShell";
import RichBodyEditor from "@/components/RichBodyEditor";
import { useRole } from "@/components/RoleContext";
import {
  AgendaItem,
  MEETING_STATUSES,
  Meeting,
  STANDARD_AGENDA_TITLES,
  agendaParts,
  meetingStore,
  minutesParts,
  newAgendaItem,
  newMeeting,
  sortMeetings,
  validateMeeting
} from "@/lib/meetingService";
import { buildPartsWord, documentPartsHtml, downloadBlob, openHtmlDocument, pageHtml } from "@/lib/moduleDocument";
import { sanitizeBodyHtml } from "@/lib/richBody";
import { thaiDate } from "@/lib/adminDocument";

const inputStyle =
  "w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20";
const btn = "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors";
const ghost = `${btn} bg-white border-slate-200 text-slate-700 hover:bg-slate-50`;

type Mode = { type: "list" } | { type: "read"; id: string } | { type: "edit"; draft: Meeting };

export default function MeetingsPage() {
  const { currentUser } = useRole();
  const [items, setItems] = useState<Meeting[]>(() => meetingStore.cached());
  const [mode, setMode] = useState<Mode>({ type: "list" });
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    meetingStore.list().then(list => {
      if (active) setItems(list);
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = async (m: Meeting) => {
    const saved = await meetingStore.save(m);
    setItems(prev => [saved, ...prev.filter(i => i.id !== saved.id)]);
    return saved;
  };

  return (
    <AdminModuleShell
      moduleKey="meetings"
      title="วาระการประชุม"
      subtitle="จัดทำระเบียบวาระและรายงานการประชุม บันทึกมติแต่ละวาระ ส่งออกเป็น PDF หรือ Word"
      actions={canEdit =>
        canEdit && mode.type === "list" ? (
          <button
            type="button"
            onClick={() => setMode({ type: "edit", draft: newMeeting({ id: currentUser?.id, name: currentUser?.name }) })}
            className={`${btn} bg-blue-900 border-blue-900 text-white hover:bg-blue-800`}
          >
            <Plus className="w-4 h-4" />
            สร้างการประชุม
          </button>
        ) : null
      }
    >
      {({ canEdit }) => {
        if (mode.type === "edit") {
          return (
            <Editor
              draft={mode.draft}
              error={error}
              onCancel={() => {
                setError("");
                setMode({ type: "list" });
              }}
              onSave={async m => {
                const next: Meeting = {
                  ...m,
                  agendaItems: m.agendaItems.map(a => ({
                    ...a,
                    title: a.title.trim(),
                    detailHtml: sanitizeBodyHtml(a.detailHtml),
                    resolutionHtml: sanitizeBodyHtml(a.resolutionHtml)
                  }))
                };
                const problem = validateMeeting(next);
                if (problem) return setError(problem);
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
              onDelete={async () => {
                if (!window.confirm(`ลบการประชุม "${item.title}" ใช่หรือไม่ การลบไม่สามารถย้อนกลับได้`)) return;
                await meetingStore.remove(item.id);
                setItems(prev => prev.filter(i => i.id !== item.id));
                setMode({ type: "list" });
              }}
            />
          );
        }

        const sorted = sortMeetings(items);
        return sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            <CalendarDays className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            {canEdit ? "ยังไม่มีการประชุม กดปุ่ม \"สร้างการประชุม\" เพื่อเริ่มต้น" : "ยังไม่มีการประชุม"}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sorted.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode({ type: "read", id: m.id })}
                className="text-left bg-white rounded-2xl border border-slate-200 hover:border-blue-900/40 hover:shadow-sm p-4 transition-all"
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-900">{m.status}</span>
                  {m.meetingNo && <span className="text-slate-500">ครั้งที่ {m.meetingNo}</span>}
                </div>
                <h3 className="mt-2 font-bold text-slate-900 leading-snug">{m.title}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {thaiDate(m.date)}
                  {m.time ? ` เวลา ${m.time} น.` : ""}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{m.agendaItems.length} วาระ{m.location ? ` | ${m.location}` : ""}</p>
              </button>
            ))}
          </div>
        );
      }}
    </AdminModuleShell>
  );
}

function Reader({
  item,
  canEdit,
  onBack,
  onEdit,
  onDelete
}: {
  item: Meeting;
  canEdit: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [view, setView] = useState<"agenda" | "minutes">("agenda");
  const parts = useMemo(() => (view === "agenda" ? agendaParts(item) : minutesParts(item)), [item, view]);
  const html = useMemo(() => documentPartsHtml(parts), [parts]);
  const label = view === "agenda" ? "ระเบียบวาระการประชุม" : "รายงานการประชุม";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onBack} className={ghost}>
          <ArrowLeft className="w-4 h-4" />
          กลับรายการ
        </button>
        <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden text-xs font-semibold">
          {(["agenda", "minutes"] as const).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-2 ${view === v ? "bg-blue-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              {v === "agenda" ? "ระเบียบวาระ" : "รายงานการประชุม"}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => openHtmlDocument(pageHtml(`${label} ${item.title}`, parts, window.location.origin))} className={ghost}>
          <Printer className="w-4 h-4" />
          พิมพ์ / PDF
        </button>
        <button
          type="button"
          onClick={async () => downloadBlob(await buildPartsWord(parts), `${label} ${item.meetingNo || item.date}.docx`)}
          className={ghost}
        >
          <FileDown className="w-4 h-4" />
          ดาวน์โหลด Word
        </button>
        {canEdit && (
          <>
            <button type="button" onClick={onEdit} className={ghost}>
              <Pencil className="w-4 h-4" />
              แก้ไข
            </button>
            <button type="button" onClick={onDelete} className={`${btn} bg-white border-rose-200 text-rose-700 hover:bg-rose-50`}>
              <Trash2 className="w-4 h-4" />
              ลบ
            </button>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" />
          {thaiDate(item.date)}
          {item.time ? ` เวลา ${item.time} น.` : ""}
        </span>
        {item.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {item.location}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {item.status}
        </span>
      </div>
      <article
        className="bg-white rounded-2xl border border-slate-200 p-6 md:p-10 max-w-3xl [&_.doc-title]:text-xl [&_.doc-title]:font-bold [&_.doc-title]:text-center [&_.doc-subtitle]:text-center [&_.doc-subtitle]:text-slate-600 [&_.doc-heading]:font-bold [&_.doc-heading]:mt-5 [&_.doc-line]:mb-1 [&_.body-para]:mb-2 [&_.doc-spacer]:h-4"
        style={{ fontFamily: "'TH SarabunPSK','Sarabun',sans-serif", fontSize: "18px" }}
        // เนื้อหามาจากชุด HTML ที่ผ่านตัวกรองของระบบเท่านั้น (documentPartsHtml)
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function Editor({
  draft,
  error,
  onCancel,
  onSave
}: {
  draft: Meeting;
  error: string;
  onCancel: () => void;
  onSave: (m: Meeting) => Promise<void>;
}) {
  const [m, setM] = useState<Meeting>(draft);
  const [busy, setBusy] = useState(false);

  const setItem = (id: string, patch: Partial<AgendaItem>) =>
    setM(prev => ({ ...prev, agendaItems: prev.agendaItems.map(a => (a.id === id ? { ...a, ...patch } : a)) }));
  const move = (index: number, delta: number) =>
    setM(prev => {
      const next = [...prev.agendaItems];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, agendaItems: next };
    });
  const field = (label: string, key: keyof Meeting, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <input className={inputStyle + " mt-1"} value={(m[key] as string) || ""} onChange={e => setM({ ...m, [key]: e.target.value })} {...props} />
    </label>
  );

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">{field("ชื่อการประชุม *", "title")}</div>
        {field("ครั้งที่", "meetingNo", { placeholder: "เช่น 3/2569" })}
        {field("วันที่ประชุม *", "date", { type: "date" })}
        {field("เวลาเริ่ม", "time", { type: "time" })}
        {field("เวลาเลิก", "endTime", { type: "time" })}
        <div className="md:col-span-2">{field("สถานที่", "location")}</div>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">สถานะ</span>
          <select className={inputStyle + " mt-1"} value={m.status} onChange={e => setM({ ...m, status: e.target.value as Meeting["status"] })}>
            {MEETING_STATUSES.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="md:col-span-2">{field("ประธานในที่ประชุม", "chair")}</div>
        {field("ผู้จดรายงานการประชุม", "recorder")}
        <label className="block md:col-span-3 md:grid md:grid-cols-2 md:gap-3">
          <span className="block">
            <span className="text-xs font-semibold text-slate-700">ผู้มาประชุม (บรรทัดละหนึ่งคน)</span>
            <textarea rows={5} className={inputStyle + " mt-1"} value={m.attendees || ""} onChange={e => setM({ ...m, attendees: e.target.value })} />
          </span>
          <span className="block">
            <span className="text-xs font-semibold text-slate-700">ผู้ไม่มาประชุม (บรรทัดละหนึ่งคน)</span>
            <textarea rows={5} className={inputStyle + " mt-1"} value={m.absentees || ""} onChange={e => setM({ ...m, absentees: e.target.value })} />
          </span>
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">ระเบียบวาระ ({m.agendaItems.length} วาระ)</h2>
          <div className="flex gap-2">
            {m.agendaItems.length === 0 && (
              <button
                type="button"
                className={ghost}
                onClick={() => setM(prev => ({ ...prev, agendaItems: STANDARD_AGENDA_TITLES.map(t => newAgendaItem(t)) }))}
              >
                <ListPlus className="w-4 h-4" />
                ใช้วาระมาตรฐาน
              </button>
            )}
            <button type="button" className={ghost} onClick={() => setM(prev => ({ ...prev, agendaItems: [...prev.agendaItems, newAgendaItem()] }))}>
              <Plus className="w-4 h-4" />
              เพิ่มวาระ
            </button>
          </div>
        </div>
        {m.agendaItems.map((a, i) => (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-900 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <input
                className={inputStyle}
                placeholder="ชื่อวาระ"
                value={a.title}
                onChange={e => setItem(a.id, { title: e.target.value })}
              />
              <button type="button" aria-label="เลื่อนขึ้น" className={ghost} onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowUp className="w-4 h-4" />
              </button>
              <button type="button" aria-label="เลื่อนลง" className={ghost} onClick={() => move(i, 1)} disabled={i === m.agendaItems.length - 1}>
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="ลบวาระ"
                className={`${btn} bg-white border-rose-200 text-rose-700 hover:bg-rose-50`}
                onClick={() => setM(prev => ({ ...prev, agendaItems: prev.agendaItems.filter(x => x.id !== a.id) }))}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-700">รายละเอียดวาระ</span>
              <div className="mt-1">
                <RichBodyEditor value={a.detailHtml} onChange={html => setItem(a.id, { detailHtml: html })} placeholder="รายละเอียดที่เสนอต่อที่ประชุม" minHeight={140} />
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-700">มติที่ประชุม / ผลการประชุม (บันทึกหลังประชุม)</span>
              <div className="mt-1">
                <RichBodyEditor value={a.resolutionHtml} onChange={html => setItem(a.id, { resolutionHtml: html })} placeholder="มติที่ประชุม" minHeight={120} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className={ghost}>
          ยกเลิก
        </button>
        <button
          type="button"
          disabled={busy}
          className={`${btn} bg-blue-900 border-blue-900 text-white`}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave(m);
            } finally {
              setBusy(false);
            }
          }}
        >
          บันทึกการประชุม
        </button>
      </div>
    </div>
  );
}
