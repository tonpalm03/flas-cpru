import { useEffect, useSyncExternalStore } from "react"

// แถบด้านบนของมือถือ: หน้าที่เปิดอยู่บอกชื่อที่จะแสดง และว่าต้องมีปุ่มย้อนกลับไหม
// หลายส่วนบอกพร้อมกันได้ (หัวหน้า + รายละเอียดที่เปิดซ้อน) — ส่วนที่บอกล่าสุดใช้ก่อน ปิดแล้วกลับไปใช้ของก่อนหน้า

export interface PhoneBar {
  title: string
  subtitle?: string
  /** true = แสดงปุ่มย้อนกลับแม้เป็นหน้าหลักของแถบล่าง (เช่น เปิดรายละเอียดงานซ้อนอยู่) */
  back?: boolean
}

let entries: { id: number; bar: PhoneBar }[] = []
let nextId = 1
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function current(): PhoneBar | null {
  return entries.length ? entries[entries.length - 1].bar : null
}

/** หน้าเรียกเพื่อตั้งชื่อบนแถบด้านบนของมือถือ (null = ไม่ตั้ง) */
export function usePhoneBar(bar: PhoneBar | null) {
  const title = bar?.title
  const subtitle = bar?.subtitle
  const back = bar?.back
  useEffect(() => {
    if (title === undefined) return
    const id = nextId++
    entries = [...entries, { id, bar: { title, subtitle, back } }]
    notify()
    return () => {
      entries = entries.filter((entry) => entry.id !== id)
      notify()
    }
  }, [title, subtitle, back])
}

export function usePhoneBarState(): PhoneBar | null {
  return useSyncExternalStore(subscribe, current, () => null)
}
