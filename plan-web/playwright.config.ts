import { defineConfig } from "@playwright/test"

// ชุดทดสอบหน้าเว็บของระบบแผน: เปิด backend (ฐานข้อมูลใหม่ทุกครั้ง + บัญชีทดสอบ) และหน้าเว็บแยกจากเครื่องพัฒนา
// รัน: npm run test:e2e  (ในเครื่อง Windows ใช้ Microsoft Edge ที่ติดตั้งอยู่; ใน CI ใช้ Chromium ของ Playwright)
const API_PORT = Number(process.env.E2E_API_PORT || 8011)
// เปลี่ยน port ได้เมื่อเครื่องมี server อื่นใช้อยู่ เช่น E2E_WEB_PORT=5185 npx playwright test
const WEB_PORT = Number(process.env.E2E_WEB_PORT || 5174)

export default defineConfig({
  testDir: "./e2e",
  // ทุกชุดใช้ backend ตัวเดียวกัน — รันทีละชุดเพื่อไม่ให้ข้อมูลของชุดหนึ่งไปกระทบอีกชุด
  workers: 1,
  fullyParallel: false,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    channel: process.env.CI ? undefined : "msedge",
    viewport: { width: 1400, height: 1000 },
    acceptDownloads: true,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node e2e/support/start-backend.mjs",
      url: `http://127.0.0.1:${API_PORT}/api/v1/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { E2E_API_PORT: String(API_PORT) },
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
      // ไม่มีค่า Supabase เหมือนเครื่อง server ที่ใช้แค่ระบบแผน (ค่าใน .env ของเครื่องพัฒนาจะไม่ถูกใช้)
      // หน้าเว็บเรียก /api/v1 ของตัวเอง แล้ว vite ส่งต่อไป backend ของชุดทดสอบ — แบบเดียวกับตอนใช้งานจริง
      env: { VITE_PROXY_TARGET: `http://127.0.0.1:${API_PORT}`, VITE_BACKEND_API_URL: "", VITE_SUPABASE_ANON_KEY: "" },
    },
  ],
})
