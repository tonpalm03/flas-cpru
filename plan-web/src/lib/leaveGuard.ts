import { useEffect } from "react"

// กันข้อมูลที่ยังไม่บันทึกหาย: ถามก่อนออกจากหน้า (เมนู ปุ่มย้อนกลับของมือถือ/เบราว์เซอร์ ปิดแท็บ)
// หน้าที่มีข้อมูลค้างเรียก useLeaveGuard(ข้อความ) — null = ไม่มีอะไรค้าง

let message: string | null = null

export function useLeaveGuard(warning: string | null) {
  useEffect(() => {
    if (!warning) return
    message = warning
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => {
      if (message === warning) message = null
      window.removeEventListener("beforeunload", onBeforeUnload)
    }
  }, [warning])
}

/** true = ออกได้ (ไม่มีข้อมูลค้าง หรือผู้ใช้ยืนยันแล้ว) */
export function confirmLeave(): boolean {
  if (!message) return true
  if (!window.confirm(message)) return false
  message = null
  return true
}
