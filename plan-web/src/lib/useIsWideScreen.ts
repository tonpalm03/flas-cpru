import { useSyncExternalStore } from "react"

// จอกว้างพอวางฟอร์มกับตัวอย่างแบบฟอร์มคู่กัน (breakpoint xl ของ Tailwind) — จอที่แคบกว่าเปิดตัวอย่างเต็มจอแทน
const QUERY = "(min-width: 1280px)"

function subscribe(callback: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}

export function useIsWideScreen(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
}
