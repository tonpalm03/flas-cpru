// ติดตั้งเป็นแอปบนมือถือ (PWA) — ไม่เก็บข้อมูลโครงการไว้ในเครื่อง ทุกอย่างมาจาก server เสมอ
// เก็บไว้แค่หน้า "ไม่มีอินเทอร์เน็ต" สำหรับตอนเปิดแอปแล้วเชื่อมต่อไม่ได้
const CACHE = "fastcpru-offline-v1"
const OFFLINE = "offline.html"

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE, "brand/icon-192.png"])))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  // เฉพาะการเปิดหน้า — คำขอ API และไฟล์อื่นไปที่ server ตามปกติ
  if (event.request.mode !== "navigate") return
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)))
})
