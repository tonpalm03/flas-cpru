import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react"
import sarabunThai400 from "@fontsource/sarabun/files/sarabun-thai-400-normal.woff2?url"
import sarabunThai700 from "@fontsource/sarabun/files/sarabun-thai-700-normal.woff2?url"
import sarabunLatin400 from "@fontsource/sarabun/files/sarabun-latin-400-normal.woff2?url"
import sarabunLatin700 from "@fontsource/sarabun/files/sarabun-latin-700-normal.woff2?url"
import { ApiError } from "../../lib/api"
import { useBackLayer } from "../../lib/backLayers"
import { Icon } from "../ui/Icons"

// ตัวอย่างแบบฟอร์มข้างหน้าเสนอโครงการ: แท็บ "แบบฟอร์ม" = ไฟล์ Word ที่ระบบจะพิมพ์จริง (สร้างใหม่ทุกครั้งที่หยุดพิมพ์)
// แท็บ "ไฟล์ต้นฉบับ" = ไฟล์ที่นำเข้า (PDF สแกน หรือ Word) ไว้เทียบทีละหน้า

const REFRESH_DELAY_MS = 800
const THAI_RANGE = "U+0E01-0E5B, U+200C-200D, U+25CC"
const LATIN_RANGE = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212"

// แบบฟอร์มใช้ TH SarabunPSK ซึ่งเครื่องส่วนใหญ่ (และมือถือ) ไม่มี — ใช้ Sarabun (OFL) ย่อให้ตัวอักษรขนาดเท่ากัน
// บรรทัดจึงตัดใกล้เคียงกับเอกสารที่พิมพ์ (Sarabun ตัวใหญ่กว่า TH SarabunPSK ที่ขนาด pt เดียวกัน)
const SARABUN_SIZE_ADJUST = "75%"
const STYLES = `
${[
  [sarabunThai400, 400, THAI_RANGE], [sarabunThai700, 700, THAI_RANGE],
  [sarabunLatin400, 400, LATIN_RANGE], [sarabunLatin700, 700, LATIN_RANGE],
].map(([url, weight, range]) => `@font-face { font-family: "Form Sarabun"; font-weight: ${weight}; font-display: swap;
  src: url("${url}") format("woff2"); unicode-range: ${range}; size-adjust: ${SARABUN_SIZE_ADJUST}; }`).join("\n")}
.form-preview .docx-wrapper { background: transparent; padding: 0; display: block; }
.form-preview .docx-wrapper > section.docx { margin: 0 auto 16px; box-shadow: 0 1px 6px rgb(15 23 42 / 0.18); }
.form-preview .docx-wrapper * { font-family: "TH SarabunPSK", "TH Sarabun New", "Form Sarabun", serif !important; }
.form-preview .scan-page { width: 100%; max-width: 820px; }
.form-preview[data-fit="false"] .scan-page { width: 820px; max-width: none; }
`

let stylesAdded = false
function addStyles() {
  if (stylesAdded) return
  const style = document.createElement("style")
  style.textContent = STYLES
  document.head.appendChild(style)
  stylesAdded = true
}

// ช่องติ๊กในแบบฟอร์มเป็นตัวอักษรฟอนต์ Wingdings ("þ" = ติ๊ก, "r" = ว่าง) — มือถือไม่มีฟอนต์นี้ จึงแทนด้วย ☑ / ☐
const SYMBOL_MARKS: Record<string, Record<number, string>> = {
  wingdings: { 0xfe: "☑", 0xfd: "☒", 0x78: "☒", 0xfc: "☑", 0xfb: "☒", 0x6e: "■", 0xa8: "☐", 0x6f: "☐", 0x71: "☐", 0x72: "☐", 0xa1: "○" },
  "wingdings 2": { 0x52: "☑", 0x54: "☒", 0x51: "☒", 0x50: "☑", 0xa3: "☐", 0x2a: "☐" },
}

function replaceSymbolFonts(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("span").forEach((span) => {
    const family = span.style.fontFamily.toLowerCase().replace(/["']/g, "")
    const marks = family.includes("wingdings 2") ? SYMBOL_MARKS["wingdings 2"] : family.includes("wingdings") ? SYMBOL_MARKS.wingdings : null
    if (!marks || span.children.length) return
    span.textContent = Array.from(span.textContent || "").map((ch) => marks[ch.charCodeAt(0) & 0xff] ?? ch).join("")
    span.style.fontFamily = ""
  })
}

/** หน้ากระดาษพอดีความกว้างของช่องแสดงผล (ไม่ขยายเกินขนาดจริง) หรือขนาดจริง (fit = false — เลื่อนซ้ายขวาได้) */
function fitWidth(scroller: HTMLElement | null, pages: HTMLElement | null, fit: boolean) {
  const wrapper = pages?.querySelector<HTMLElement>(".docx-wrapper")
  const page = wrapper?.querySelector<HTMLElement>("section.docx")
  if (!scroller || !wrapper || !page) return
  wrapper.style.zoom = "1"
  const available = scroller.clientWidth - 24
  wrapper.style.zoom = fit ? String(Math.min(1, available / page.offsetWidth)) : "1"
}

/** เลื่อนไปที่หัวข้อ "<เลขข้อ>." ของแบบฟอร์ม (เช่น ขั้นงบประมาณ → ข้อ 9) — 0 = ต้นหน้า */
function scrollToItem(scroller: HTMLElement | null, pages: HTMLElement | null, item: number) {
  if (!scroller || !pages) return
  if (item <= 0) {
    scroller.scrollTo({ top: 0, behavior: "smooth" })
    return
  }
  const heading = new RegExp(`^\\s*${item}\\s*\\.(?!\\d)`)
  const target = Array.from(pages.querySelectorAll<HTMLElement>("p")).find((p) => heading.test(p.textContent || ""))
  if (!target) return
  const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 12
  scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
}

async function renderWord(data: Blob, into: HTMLElement) {
  const { renderAsync } = await import("docx-preview")
  const staging = document.createElement("div")
  await renderAsync(data, staging, staging, {
    className: "docx",
    inWrapper: true,
    breakPages: true,
    ignoreLastRenderedPageBreak: true,
    // หัวกระดาษมีแค่ "หน้า N" ซึ่งตัวแสดงผลคำนวณเลขหน้าไม่ได้ (แสดงเลขผิด) — ไม่แสดง
    renderHeaders: false,
    renderFooters: false,
  })
  replaceSymbolFonts(staging)
  into.replaceChildren(...Array.from(staging.childNodes))
}

// ความกว้างภาพของหน้าสแกน (px) — คมพอซูมอ่านบนมือถือ
const SCAN_PAGE_PIXELS = 1100

async function renderPdf(file: File, into: HTMLElement) {
  const pdfjs = await import("pdfjs-dist")
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  // ข้อความในไฟล์สแกนมักเก็บเป็น JBIG2 ซึ่งถอดด้วย wasm (vite.config.ts คัดลอกไว้ที่ /pdfjs-wasm/)
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    wasmUrl: `${import.meta.env.BASE_URL}pdfjs-wasm/`,
  }).promise
  const images: HTMLImageElement[] = []
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number)
    const viewport = page.getViewport({ scale: SCAN_PAGE_PIXELS / page.getViewport({ scale: 1 }).width })
    const canvas = document.createElement("canvas")
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    await page.render({ canvas, viewport }).promise
    // เก็บเป็นภาพ JPEG แทน canvas — ไฟล์ 13 หน้าไม่กินหน่วยความจำมือถือ
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85))
    canvas.width = 0
    const image = document.createElement("img")
    image.src = blob ? URL.createObjectURL(blob) : ""
    image.alt = `หน้า ${number}`
    image.className = "scan-page mx-auto mb-4 block bg-white shadow"
    images.push(image)
  }
  into.replaceChildren(...images)
  return images.map((image) => image.src).filter(Boolean)
}

interface FormPreviewProps {
  /** ไฟล์ Word ของแบบฟอร์มจากข้อมูลล่าสุด */
  loadDocument: (signal: AbortSignal) => Promise<Blob>
  /** เปลี่ยนเมื่อข้อมูลเปลี่ยน → สร้างตัวอย่างใหม่หลังหยุดพิมพ์ */
  dataKey: string
  /** ไฟล์ที่นำเข้า (PDF สแกน / Word) — มีแล้วจึงแสดงแท็บ "ไฟล์ต้นฉบับ" */
  sourceFile?: File
  /** ข้อของแบบฟอร์มที่ตรงกับขั้นที่กำลังกรอก */
  item: number
  onClose?: () => void
  closeLabel?: string
}

export function FormPreview({ loadDocument, dataKey, sourceFile, item, onClose, closeLabel = "ปิด" }: FormPreviewProps) {
  const [tab, setTab] = useState<"form" | "source">("form")
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState("")
  const [sourceStatus, setSourceStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  // พอดีความกว้างจอ หรือขนาดจริง (อ่านตัวเล็กบนมือถือ — เลื่อนซ้ายขวาได้)
  const [fit, setFit] = useState(true)
  const fitRef = useRef(fit)
  const imageUrls = useRef<string[]>([])
  const scroller = useRef<HTMLDivElement>(null)
  const pages = useRef<HTMLDivElement>(null)
  const sourcePages = useRef<HTMLDivElement>(null)
  const load = useRef(loadDocument)
  const shown = useRef(false)
  const itemRef = useRef(item)

  useLayoutEffect(() => {
    load.current = loadDocument
    itemRef.current = item
    fitRef.current = fit
  })

  useEffect(addStyles, [])
  useEffect(() => () => imageUrls.current.forEach((url) => URL.revokeObjectURL(url)), [])
  useEffect(() => {
    fitWidth(scroller.current, pages.current, fit)
    fitWidth(scroller.current, sourcePages.current, fit)
  }, [fit])

  // สร้างแบบฟอร์มใหม่เมื่อข้อมูลเปลี่ยน (ครั้งแรกทันที ครั้งต่อไปรอหยุดพิมพ์)
  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setStatus("loading")
      try {
        const data = await load.current(controller.signal)
        if (controller.signal.aborted || !pages.current) return
        const top = scroller.current?.scrollTop ?? 0
        await renderWord(data, pages.current)
        if (controller.signal.aborted) return
        fitWidth(scroller.current, pages.current, fitRef.current)
        if (shown.current) {
          if (scroller.current) scroller.current.scrollTop = top
        } else {
          shown.current = true
          scrollToItem(scroller.current, pages.current, itemRef.current)
        }
        setStatus("ready")
      } catch (e) {
        if (controller.signal.aborted) return
        setError(e instanceof ApiError ? e.detail : "แสดงตัวอย่างแบบฟอร์มไม่ได้")
        setStatus("error")
      }
    }, shown.current ? REFRESH_DELAY_MS : 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [dataKey])

  // เปลี่ยนขั้น → เลื่อนไปที่ข้อของขั้นนั้น
  useEffect(() => {
    if (shown.current && tab === "form") scrollToItem(scroller.current, pages.current, item)
  }, [item, tab])

  // ช่องแสดงผลเปลี่ยนขนาด (หมุนจอ / ย่อหน้าต่าง) → ย่อหน้ากระดาษใหม่
  useEffect(() => {
    const element = scroller.current
    if (!element) return
    const observer = new ResizeObserver(() => {
      fitWidth(element, pages.current, fitRef.current)
      fitWidth(element, sourcePages.current, fitRef.current)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // ไฟล์ต้นฉบับ: วาดครั้งแรกที่เปิดแท็บ
  useEffect(() => {
    if (tab !== "source" || !sourceFile || sourceStatus !== "idle" || !sourcePages.current) return
    setSourceStatus("loading")
    const render = sourceFile.name.toLowerCase().endsWith(".pdf")
      ? renderPdf(sourceFile, sourcePages.current).then((urls) => {
          imageUrls.current = urls
        })
      : renderWord(sourceFile, sourcePages.current)
    render
      .then(() => {
        setSourceStatus("ready")
        requestAnimationFrame(() => fitWidth(scroller.current, sourcePages.current, fitRef.current))
      })
      .catch(() => setSourceStatus("error"))
  }, [tab, sourceFile, sourceStatus])

  return (
    <div data-testid="form-preview" data-fit={fit} className="form-preview flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-slate-100">
      <div className="flex items-center gap-2 border-b border-line bg-white px-3 py-2">
        <div role="tablist" className="flex min-w-0 flex-1 gap-1">
          <PreviewTab active={tab === "form"} onClick={() => setTab("form")} testId="preview-tab-form">
            แบบฟอร์ม
          </PreviewTab>
          {sourceFile && (
            <PreviewTab active={tab === "source"} onClick={() => setTab("source")} testId="preview-tab-source">
              ไฟล์ต้นฉบับ
            </PreviewTab>
          )}
        </div>
        {tab === "form" && status === "loading" && <span className="shrink-0 text-[11px] text-muted">กำลังอัปเดต...</span>}
        <button
          type="button"
          data-testid="preview-fit"
          onClick={() => setFit((value) => !value)}
          className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-[11px] font-bold text-ink hover:bg-slate-50"
        >
          {fit ? "ขนาดจริง" : "พอดีจอ"}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            title={closeLabel}
            className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-ink"
          >
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
      <div ref={scroller} className="min-h-0 flex-1 overflow-auto overscroll-contain p-3">
        {tab === "form" && status === "error" && (
          <p role="alert" className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {error}
          </p>
        )}
        <div ref={pages} data-testid="preview-pages" hidden={tab !== "form"} />
        {sourceFile && (
          <div hidden={tab !== "source"}>
            {sourceStatus === "loading" && <p className="py-6 text-center text-xs text-muted">กำลังเปิดไฟล์ {sourceFile.name}...</p>}
            {sourceStatus === "error" && (
              <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                เปิดไฟล์ต้นฉบับไม่ได้
              </p>
            )}
            <div ref={sourcePages} data-testid="preview-source-pages" />
          </div>
        )}
      </div>
    </div>
  )
}

function PreviewTab({ active, onClick, testId, children }: { active: boolean; onClick: () => void; testId: string; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-testid={testId}
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${active ? "bg-brand-soft text-brand-2" : "text-muted hover:bg-slate-100"}`}
    >
      {children}
    </button>
  )
}

/** มือถือ/จอแคบ: ตัวอย่างเต็มจอ — ปิดด้วยปุ่มย้อนกลับของมือถือได้ (mount ค้างไว้แล้วสลับ open ตาม useBackLayer) */
export function FormPreviewSheet({ open, onClose, ...props }: Omit<FormPreviewProps, "onClose"> & { open: boolean; onClose: () => void }) {
  useBackLayer(open, onClose)
  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ตัวอย่างแบบฟอร์ม"
      className="fixed inset-0 z-50 flex flex-col bg-slate-100 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <FormPreview {...props} onClose={onClose} closeLabel="ปิดตัวอย่าง" />
    </div>
  )
}
