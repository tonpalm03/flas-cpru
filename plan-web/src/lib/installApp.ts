import { useSyncExternalStore } from "react"

// ติดตั้งเป็นแอปบนมือถือ (PWA)
// - Android/Chrome: เบราว์เซอร์ส่ง beforeinstallprompt มาเมื่อติดตั้งได้ → เก็บไว้ แล้วเรียกตอนกดปุ่ม "ติดตั้งแอป"
// - iPhone/Safari: ไม่มีปุ่มให้เรียก ต้องแนะนำ แชร์ → เพิ่มไปยังหน้าจอโฮม
// - เปิดผ่าน http (ไม่ใช่ https): เบราว์เซอร์ไม่ให้ติดตั้ง ต้องใช้ลิงก์ https

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

let deferred: InstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

/** เรียกครั้งเดียวตอนเปิดแอป (main.tsx) — ต้องเริ่มฟังก่อนเบราว์เซอร์ส่ง event */
export function listenForInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault()
    deferred = event as InstallPromptEvent
    notify()
  })
  window.addEventListener("appinstalled", () => {
    installed = true
    deferred = null
    notify()
  })
}

export function isStandalone(): boolean {
  return (
    installed ||
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

export type InstallState = "installed" | "prompt" | "ios" | "needs-https" | "browser-menu"

function currentState(): InstallState {
  if (isStandalone()) return "installed"
  if (deferred) return "prompt"
  if (isIos()) return "ios"
  if (!window.isSecureContext) return "needs-https"
  return "browser-menu"
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    currentState,
    () => "browser-menu" as InstallState
  )
}

/** เปิดกล่องติดตั้งของเบราว์เซอร์ (Android) — คืน true ถ้าผู้ใช้กดติดตั้ง */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  const event = deferred
  deferred = null
  await event.prompt()
  const choice = await event.userChoice
  notify()
  return choice.outcome === "accepted"
}
