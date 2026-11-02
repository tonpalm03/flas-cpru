import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import { listenForInstallPrompt } from "./lib/installApp"

// ปุ่ม "ติดตั้งแอป": ต้องเริ่มฟังก่อนเบราว์เซอร์แจ้งว่าติดตั้งได้ (เกิดตอนเปิดหน้าไม่นาน)
listenForInstallPrompt()

// แอปบนมือถือ (PWA): ลงทะเบียนเฉพาะไฟล์ที่ build แล้ว — ตอนพัฒนาไม่ใช้ เพื่อไม่ให้ค้างไฟล์เก่า
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined)
  })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
