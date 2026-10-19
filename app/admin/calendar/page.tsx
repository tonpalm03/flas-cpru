"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import AdminModuleShell from "@/components/AdminModuleShell";
import { useRole } from "@/components/RoleContext";
import {
  CALENDAR_CATEGORIES,
  CATEGORY_STYLES,
  CalendarEvent,
  THAI_WEEKDAYS_SHORT,
  calendarStore,
  eventsOnDate,
  monthGrid,
  monthLabel,
  newCalendarEvent,
  toIsoDate,
  validateCalendarEvent
} from "@/lib/calendarService";
import { thaiDate, toThaiDigits } from "@/lib/adminDocument";

const inputStyle =
  "w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20";
const btn = "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors";
const ghost = `${btn} bg-white border-slate-200 text-slate-700 hover:bg-slate-50`;

function todayIso() {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function CalendarPage() {
  const { currentUser } = useRole();
  const [events, setEvents] = useState<CalendarEvent[]>(() => calendarStore.cached());
  const [today] = useState(todayIso);
  const [cursor, setCursor] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [selected, setSelected] = useState(today);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    calendarStore.list().then(list => {
      if (active) setEvents(list);
    });
    return () => {
      active = false;
    };
  }, []);

  const weeks = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const shift = (delta: number) =>
    setCursor(c => {
      const d = new Date(Date.UTC(c.y, c.m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });

  const save = async (e: CalendarEvent) => {
    const problem = validateCalendarEvent(e);
    if (problem) return setError(problem);
    setError("");
    const saved = await calendarStore.save({ ...e, endDate: e.endDate && e.endDate > e.date ? e.endDate : undefined });
    setEvents(prev => [saved, ...prev.filter(x => x.id !== saved.id)]);
    setSelected(saved.date);
    setEditing(null);
  };

  const remove = async (e: CalendarEvent) => {
    if (!window.confirm(`ลบ "${e.title}" ใช่หรือไม่`)) return;
    await calendarStore.remove(e.id);
    setEvents(prev => prev.filter(x => x.id !== e.id));
  };

  return (
    <AdminModuleShell
      moduleKey="calendar"
      title="ระบบตารางงาน"
      subtitle="ปฏิทินงานและกิจกรรมของคณะ บุคลากรทุกคนดูได้ ผู้มีสิทธิ์เพิ่มและแก้ไขได้"
      actions={canEdit =>
        canEdit ? (
          <button
            type="button"
            onClick={() => setEditing(newCalendarEvent(selected, { id: currentUser?.id, name: currentUser?.name }))}
            className={`${btn} bg-blue-900 border-blue-900 text-white hover:bg-blue-800`}
          >
            <Plus className="w-4 h-4" />
            เพิ่มรายการ
          </button>
        ) : null
      }
    >
      {({ canEdit }) => {
        const dayEvents = eventsOnDate(events, selected);
        return (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-slate-900">{monthLabel(cursor.y, cursor.m)}</h2>
                <div className="flex gap-1.5">
                  <button type="button" aria-label="เดือนก่อนหน้า" className={ghost} onClick={() => shift(-1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className={ghost}
                    onClick={() => {
                      setCursor({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 });
                      setSelected(today);
                    }}
                  >
                    วันนี้
                  </button>
                  <button type="button" aria-label="เดือนถัดไป" className={ghost} onClick={() => shift(1)}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-500 mb-1">
                {THAI_WEEKDAYS_SHORT.map(d => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 border-t border-l border-slate-200">
                {weeks.flat().map(({ date, inMonth }) => {
                  const list = eventsOnDate(events, date);
                  const isSelected = date === selected;
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSelected(date)}
                      className={`min-h-[84px] text-left p-1 border-r border-b border-slate-200 align-top transition-colors ${
                        inMonth ? "bg-white" : "bg-slate-50 text-slate-400"
                      } ${isSelected ? "ring-2 ring-inset ring-blue-900" : "hover:bg-blue-50/40"}`}
                    >
                      <span
                        className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-semibold ${
                          date === today ? "bg-blue-900 text-white" : ""
                        }`}
                      >
                        {toThaiDigits(String(Number(date.slice(8))))}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {list.slice(0, 3).map(e => (
                          <div key={e.id} className={`truncate rounded px-1 text-[10px] leading-4 ${CATEGORY_STYLES[e.category]}`}>
                            {e.title}
                          </div>
                        ))}
                        {list.length > 3 && <div className="text-[10px] text-slate-500">+{list.length - 3} รายการ</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {CALENDAR_CATEGORIES.map(c => (
                  <span key={c} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_STYLES[c]}`}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <aside className="bg-white rounded-2xl border border-slate-200 p-4 h-fit space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{thaiDate(selected)}</h3>
                {canEdit && (
                  <button
                    type="button"
                    className={ghost}
                    onClick={() => setEditing(newCalendarEvent(selected, { id: currentUser?.id, name: currentUser?.name }))}
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่ม
                  </button>
                )}
              </div>
              {dayEvents.length === 0 && <p className="text-xs text-slate-500">ไม่มีรายการในวันนี้</p>}
              {dayEvents.map(e => (
                <div key={e.id} className="rounded-xl border border-slate-200 p-3 space-y-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_STYLES[e.category]}`}>{e.category}</span>
                  <p className="font-semibold text-slate-900 text-sm">{e.title}</p>
                  {(e.time || e.endDate) && (
                    <p className="text-xs text-slate-600 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {e.time ? `${e.time}${e.endTime ? `-${e.endTime}` : ""} น.` : ""}
                      {e.endDate ? ` ถึง ${thaiDate(e.endDate)}` : ""}
                    </p>
                  )}
                  {e.location && (
                    <p className="text-xs text-slate-600 inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {e.location}
                    </p>
                  )}
                  {e.description && <p className="text-xs text-slate-600 whitespace-pre-line">{e.description}</p>}
                  {canEdit && (
                    <div className="flex gap-1.5 pt-1">
                      <button type="button" className={ghost} onClick={() => setEditing(e)}>
                        <Pencil className="w-3.5 h-3.5" />
                        แก้ไข
                      </button>
                      <button type="button" className={`${btn} bg-white border-rose-200 text-rose-700 hover:bg-rose-50`} onClick={() => remove(e)}>
                        <Trash2 className="w-3.5 h-3.5" />
                        ลบ
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </aside>

            {editing && (
              <EventDialog
                event={editing}
                error={error}
                onChange={setEditing}
                onCancel={() => {
                  setError("");
                  setEditing(null);
                }}
                onSave={() => save(editing)}
              />
            )}
          </div>
        );
      }}
    </AdminModuleShell>
  );
}

function EventDialog({
  event,
  error,
  onChange,
  onCancel,
  onSave
}: {
  event: CalendarEvent;
  error: string;
  onChange: (e: CalendarEvent) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const set = (patch: Partial<CalendarEvent>) => onChange({ ...event, ...patch });
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">รายการตารางงาน</h2>
          <button type="button" aria-label="ปิด" onClick={onCancel} className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">ชื่อกิจกรรม/งาน *</span>
          <input className={inputStyle + " mt-1"} value={event.title} onChange={e => set({ title: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">ประเภท</span>
            <select className={inputStyle + " mt-1"} value={event.category} onChange={e => set({ category: e.target.value as CalendarEvent["category"] })}>
              {CALENDAR_CATEGORIES.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">สถานที่</span>
            <input className={inputStyle + " mt-1"} value={event.location || ""} onChange={e => set({ location: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">วันที่เริ่ม *</span>
            <input type="date" className={inputStyle + " mt-1"} value={event.date} onChange={e => set({ date: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">วันที่สิ้นสุด (ถ้าหลายวัน)</span>
            <input type="date" className={inputStyle + " mt-1"} value={event.endDate || ""} onChange={e => set({ endDate: e.target.value || undefined })} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">เวลาเริ่ม</span>
            <input type="time" className={inputStyle + " mt-1"} value={event.time || ""} onChange={e => set({ time: e.target.value || undefined })} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">เวลาสิ้นสุด</span>
            <input type="time" className={inputStyle + " mt-1"} value={event.endTime || ""} onChange={e => set({ endTime: e.target.value || undefined })} />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">รายละเอียด</span>
          <textarea rows={3} className={inputStyle + " mt-1"} value={event.description || ""} onChange={e => set({ description: e.target.value })} />
        </label>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={ghost} onClick={onCancel}>
            ยกเลิก
          </button>
          <button type="button" className={`${btn} bg-blue-900 border-blue-900 text-white`} onClick={onSave}>
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
