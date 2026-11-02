import { useSyncExternalStore } from "react"

// จอเล็ก (มือถือ/แท็บเล็ตแนวตั้ง) — ตรงกับ breakpoint lg ของ Tailwind ที่ใช้สลับเมนูซ้าย/แถบล่าง
const QUERY = "(max-width: 1023px)"

function subscribe(callback: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}

export function useIsPhone(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
}
