import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// ตัวถอดรหัสภาพของ pdf.js (JBIG2 / JPEG 2000 — เครื่องสแกนเก็บข้อความเป็น JBIG2) โหลดจาก /pdfjs-wasm/<ชื่อไฟล์เดิม>
// ชื่อไฟล์ต้องคงเดิม (pdf.js ต่อชื่อเอง) จึงคัดลอกตรง ๆ แทนการ import ที่ได้ชื่อมี hash — ดู components/plan/FormPreview.tsx
const PDFJS_WASM_DIR = path.resolve(process.cwd(), 'node_modules/pdfjs-dist/wasm')
const PDFJS_WASM_FILES = ['jbig2.wasm', 'openjpeg.wasm', 'qcms_bg.wasm']

function pdfjsWasm(): Plugin {
  return {
    name: 'pdfjs-wasm',
    configureServer(server) {
      server.middlewares.use('/pdfjs-wasm', (req, res, next) => {
        const file = path.basename(req.url || '')
        if (!PDFJS_WASM_FILES.includes(file)) return next()
        res.setHeader('Content-Type', 'application/wasm')
        fs.createReadStream(path.join(PDFJS_WASM_DIR, file)).pipe(res)
      })
    },
    generateBundle() {
      for (const file of PDFJS_WASM_FILES) {
        this.emitFile({ type: 'asset', fileName: `pdfjs-wasm/${file}`, source: fs.readFileSync(path.join(PDFJS_WASM_DIR, file)) })
      }
    },
  }
}

// หน้าเว็บเรียก backend ที่ /api/v1 ของที่อยู่เดียวกัน แล้วส่งต่อไป backend ในเครื่อง (dev และ preview)
// → ลิงก์เดียวใช้ได้ทุกเครื่อง/มือถือ ทั้งผ่าน IP ในเครือข่าย และลิงก์ชั่วคราว (tunnel)
const backend = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8001'
const proxy = { '/api': { target: backend } }
// ชื่อโดเมนของลิงก์ชั่วคราว (Cloudflare quick tunnel / ngrok) — ปกติ Vite รับเฉพาะ localhost และ IP
const allowedHosts = ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.app']

// ระบบแผนเป็นส่วนหนึ่งของเว็บคณะ: เปิดที่ /plan/ และ build ลง out/plan ของ Next (หลัง next build — ดู package.json ราก)
// ค่า Firebase อ่านจาก .env.local ของเว็บหลัก (NEXT_PUBLIC_FIREBASE_*) ใช้โปรเจกต์และ login เดียวกัน
// https://vite.dev/config/
export default defineConfig({
  base: '/plan/',
  envDir: '..',
  envPrefix: ['VITE_', 'NEXT_PUBLIC_FIREBASE_'],
  build: {
    outDir: '../out/plan',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    pdfjsWasm(),
  ],
  // โหลดแบบ dynamic import (ตัวอย่างแบบฟอร์ม) — เตรียมไว้ตั้งแต่เปิด dev server
  // ไม่งั้นครั้งแรกที่เปิดตัวอย่าง Vite จะเตรียม dependency ใหม่แล้วโหลดหน้าซ้ำกลางทาง
  optimizeDeps: {
    include: ['docx-preview', 'pdfjs-dist'],
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy,
    allowedHosts,
  },
  preview: {
    port: 5173,
    host: true,
    proxy,
    allowedHosts,
  },
})
