import { useState } from "react"
import { InstallState, promptInstall, useInstallState } from "../../lib/installApp"
import { BottomSheet } from "../ui/BottomSheet"
import { Button } from "../ui/Button"
import { Icon } from "../ui/Icons"

/**
 * ปุ่ม "ติดตั้งแอป": Android/Chrome เปิดกล่องติดตั้งของเครื่องทันที
 * ที่อื่น (iPhone, ลิงก์ http, เบราว์เซอร์ที่ไม่มีกล่องติดตั้ง) เปิดแผ่นวิธีติดตั้งแทน
 */
export function useInstallApp() {
  const state = useInstallState()
  const [helpOpen, setHelpOpen] = useState(false)
  const start = async () => {
    if (state === "prompt" && (await promptInstall().catch(() => false))) return
    if (state !== "prompt") setHelpOpen(true)
  }
  const sheet = <InstallHelpSheet open={helpOpen} state={state} onClose={() => setHelpOpen(false)} />
  return { state, installed: state === "installed", start, sheet }
}

const STEPS: Record<Exclude<InstallState, "installed" | "prompt">, { title: string; steps: string[]; note?: string }> = {
  ios: {
    title: "ติดตั้งบน iPhone / iPad",
    steps: ['เปิดลิงก์นี้ใน Safari', 'แตะปุ่ม "แชร์" (สี่เหลี่ยมมีลูกศรชี้ขึ้น) ที่แถบล่าง', 'เลือก "เพิ่มไปยังหน้าจอโฮม" แล้วแตะ "เพิ่ม"'],
  },
  "needs-https": {
    title: "ติดตั้งได้เมื่อเปิดจากลิงก์ https",
    steps: ["เปิดระบบจากลิงก์ที่ขึ้นต้นด้วย https:// (ลิงก์ที่เจ้าหน้าที่แผนส่งให้)", 'แตะปุ่ม "ติดตั้งแอป" อีกครั้ง'],
    note: "ลิงก์ที่เปิดอยู่ตอนนี้เป็น http — มือถือไม่ยอมให้ติดตั้งเป็นแอปจากลิงก์แบบนี้",
  },
  "browser-menu": {
    title: "ติดตั้งจากเมนูของเบราว์เซอร์",
    steps: ["แตะเมนู ⋮ มุมขวาบนของ Chrome", 'เลือก "ติดตั้งแอป" หรือ "เพิ่มลงในหน้าจอหลัก"', 'แตะ "ติดตั้ง" — ไอคอน "ระบบแผน" จะอยู่บนหน้าจอโฮม'],
    note: "ถ้าในเมนูมี \"เปิดในแอป\" แปลว่าติดตั้งไว้แล้ว",
  },
}

function InstallHelpSheet({ open, state, onClose }: { open: boolean; state: InstallState; onClose: () => void }) {
  const help = state === "installed" || state === "prompt" ? null : STEPS[state]
  return (
    <BottomSheet open={open && help !== null} onClose={onClose} title="ติดตั้งแอประบบแผน" testId="install-help">
      {help && (
        <div className="space-y-4 px-5 pb-2 pt-1">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}brand/icon-192.png`} alt="" className="size-12 rounded-2xl shadow-sm" />
            <div>
              <div className="text-base font-bold text-ink">{help.title}</div>
              <div className="text-xs text-muted">เปิดจากไอคอนบนหน้าจอโฮมได้เหมือนแอปทั่วไป</div>
            </div>
          </div>
          <ol className="space-y-2.5">
            {help.steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3 text-sm text-ink">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">{index + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          {help.note && (
            <p className="flex items-start gap-2 rounded-xl bg-surface px-3 py-2.5 text-xs text-muted">
              <Icon name="alert" size={14} className="mt-0.5 shrink-0 text-brand-2" />
              {help.note}
            </p>
          )}
          <Button variant="outline" className="w-full" onClick={onClose}>
            เข้าใจแล้ว
          </Button>
        </div>
      )}
    </BottomSheet>
  )
}
