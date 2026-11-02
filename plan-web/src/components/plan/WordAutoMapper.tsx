import React, { useState, useRef, useEffect } from "react"
import { Icon } from "../ui/Icons"
import { Button } from "../ui/Button"
import { templateService } from "../../services/templateService"

interface AvailableTag {
  tag: string
  label: string
}

interface MappingItem {
  slot_id: string
  context: string
  matched_pattern: string
  location_type: string
  suggested_tag: string | null
  confidence: number
  reason: string
  prefix?: string
  suffix?: string
}

interface WordAutoMapperProps {
  fiscalYear: number
  availableTags: AvailableTag[]
  onTemplateUpdated?: (url: string) => void
}

export function WordAutoMapper({
  fiscalYear,
  availableTags,
  onTemplateUpdated,
}: WordAutoMapperProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [templateName, setTemplateName] = useState(
    `แบบฟอร์มเสนอโครงการ มรภ.ชัยภูมิ (พ.ศ. ${fiscalYear})`
  )

  // Backend Health State
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking")

  const verifyBackend = async () => {
    setBackendStatus("checking")
    const isAlive = await templateService.checkBackendHealth()
    setBackendStatus(isAlive ? "online" : "offline")
  }

  useEffect(() => {
    verifyBackend()
  }, [])

  // Status States
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Mappings
  const [mappings, setMappings] = useState<MappingItem[]>([])
  const [selectedTags, setSelectedTags] = useState<Record<string, string>>({})

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!file.name.endsWith(".docx")) {
        setErrorMsg("กรุณาเลือกไฟล์เอกสารนามสกุล .docx เท่านั้น")
        return
      }
      setSelectedFile(file)
      setErrorMsg(null)
      setSuccessMsg(null)
      setMappings([])
      setSelectedTags({})
      // Auto analyze when file selected
      startAnalysis(file)
    }
  }

  // Trigger file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (!file.name.endsWith(".docx")) {
        setErrorMsg("กรุณาเลือกไฟล์เอกสารนามสกุล .docx เท่านั้น")
        return
      }
      setSelectedFile(file)
      setErrorMsg(null)
      setSuccessMsg(null)
      setMappings([])
      setSelectedTags({})
      startAnalysis(file)
    }
  }

  // Step 1: Call Backend to Extract & Analyze with Gemini 3.8 Flash
  const startAnalysis = async (file: File) => {
    setIsAnalyzing(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await templateService.analyzeDocx(file, availableTags)
      if (res.status === "warning") {
        setErrorMsg(res.message)
        setMappings([])
      } else {
        setMappings(res.preview || [])
        // Initialize user-selected tags from AI suggestions
        const initialSelected: Record<string, string> = {}
        ;(res.preview || []).forEach((item: MappingItem) => {
          if (item.suggested_tag) {
            initialSelected[item.slot_id] = item.suggested_tag
          }
        })
        setSelectedTags(initialSelected)
      }
    } catch (err: any) {
      setErrorMsg(err.message || "ไม่สามารถเชื่อมต่อระบบวิเคราะห์เอกสารได้")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Change mapping
  const handleTagChange = (slotId: string, newTag: string) => {
    setSelectedTags((prev) => ({
      ...prev,
      [slotId]: newTag,
    }))
  }

  // Prepare confirmed mappings payload
  const getConfirmedMappingsPayload = () => {
    return mappings.map((m) => ({
      slot_id: m.slot_id,
      matched_pattern: m.matched_pattern,
      prefix: m.prefix || "",
      suffix: m.suffix || "",
      selected_tag: selectedTags[m.slot_id] || null,
    }))
  }

  // Step 2: Download Test File
  const handleDownloadTest = async () => {
    if (!selectedFile) return
    setIsDownloading(true)
    setErrorMsg(null)
    try {
      const payload = getConfirmedMappingsPayload()
      const blob = await templateService.downloadTestTemplate(selectedFile, payload)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `template_preview_${selectedFile.name}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setErrorMsg(err.message || "ดาวน์โหลดไม่สำเร็จ")
    } finally {
      setIsDownloading(false)
    }
  }

  // Step 3: Save to Supabase Storage & Template
  const handleConfirmSave = async () => {
    if (!selectedFile) return
    setIsSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const payload = getConfirmedMappingsPayload()
      const res = await templateService.saveAutoMappedTemplate(
        selectedFile,
        templateName,
        payload,
        fiscalYear
      )
      setSuccessMsg(
        `บันทึกเทมเพลตขึ้นระบบสำเร็จ! (แทนที่ป้ายแท็กเรียบร้อย ${res.replaced_count} จุด)`
      )
      if (res.file_url && onTemplateUpdated) {
        onTemplateUpdated(res.file_url)
      }
    } catch (err: any) {
      setErrorMsg(err.message || "บันทึกเทมเพลตไม่สำเร็จ")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brand to-brand-hover p-5 text-white shadow-md">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                AI Powered by Gemini 3.8 Flash
              </span>
              <span className="text-xs text-white/70">ระบบรักษาฟอนต์และตาราง 100%</span>
            </div>
            <h3 className="mt-2 text-lg font-bold text-white">
              AI Auto-Mapper: แปลงฟอร์ม Word เปล่าให้เป็นแม่แบบระบบแผนอัตโนมัติ
            </h3>
            <p className="mt-1 text-xs text-white/80 max-w-2xl leading-relaxed">
              เพียงลากไฟล์ Word ที่มีจุดไข่ปลา (.....) มาวาง ระบบจะสแกนหาช่องว่างและใช้ Gemini
              จับคู่ตัวแปรให้อัตโนมัติ โดยฟอนต์ สไตล์ และระยะขอบของ มรภ.ชัยภูมิ จะคงเดิมทุกประการ
            </p>
          </div>

          {/* Backend Status Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {backendStatus === "online" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/40 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                AI Backend พร้อมทำงาน (Port 8001)
              </span>
            )}
            {backendStatus === "offline" && (
              <button
                type="button"
                onClick={verifyBackend}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/30 px-3 py-1 text-xs font-semibold text-rose-200 border border-rose-500/50 hover:bg-rose-500/40 transition-colors cursor-pointer"
                title="คลิกเพื่อตรวจเช็คสถานะการเชื่อมต่อใหม่"
              >
                <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                AI Backend ออฟไลน์ (กดตรวจใหม่)
              </button>
            )}
            {backendStatus === "checking" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200 border border-amber-500/40">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
                กำลังตรวจ Backend...
              </span>
            )}
          </div>
        </div>
      </div>

      {backendStatus === "offline" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-sm flex items-start gap-3">
          <Icon name="alert" size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">ยังไม่ได้เปิดระบบ Python AI Backend (พอร์ต 8001)</p>
            <p className="text-amber-800">
              ระบบต้องการ Python FastAPI เพื่อเรียกใช้งาน Gemini 3.8 Flash และ python-docx ในการวิเคราะห์และรักษาฟอนต์ Word โดยรันคำสั่ง:
            </p>
            <code className="block rounded bg-amber-100/90 px-2.5 py-1 font-mono text-[11px] text-amber-950 select-all border border-amber-200">
              cd backend ; venv\Scripts\python -m uvicorn main:app --port 8001 --reload
            </code>
          </div>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer ${
          selectedFile
            ? "border-emerald-500 bg-emerald-50/40"
            : "border-slate-300 bg-slate-50/60 hover:border-brand hover:bg-slate-100/60"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-brand group-hover:scale-110 transition-transform">
          <Icon name="upload" size={26} />
        </div>

        {selectedFile ? (
          <div className="mt-3 text-center">
            <p className="text-sm font-bold text-emerald-900">{selectedFile.name}</p>
            <p className="text-xs text-emerald-700">
              ขนาด {(selectedFile.size / 1024).toFixed(1)} KB • คลิกหรือลากไฟล์ใหม่เพื่อเปลี่ยน
            </p>
          </div>
        ) : (
          <div className="mt-3 text-center">
            <p className="text-sm font-bold text-ink">
              ลากไฟล์ Word (.docx) มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
            </p>
            <p className="text-xs text-muted mt-1">
              รองรับไฟล์เอกสารราชการ/แบบฟอร์มขออนุมัติโครงการ มรภ.ชัยภูมิ (.docx)
            </p>
          </div>
        )}
      </div>

      {/* Status Indicators */}
      {isAnalyzing && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800 text-xs animate-pulse">
          <div className="size-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <div>
            <p className="font-bold">Gemini 3.8 Flash กำลังอ่านเอกสารและวิเคราะห์บริบท...</p>
            <p className="text-blue-600">กำลังจับคู่จุดไข่ปลา (.....) เข้ากับฐานข้อมูลตัวแปรระบบแผน</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-xs">
          <Icon name="alert" size={18} className="text-rose-600 shrink-0" />
          <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-xs">
          <Icon name="check" size={18} className="text-emerald-600 shrink-0" />
          <p className="font-bold">{successMsg}</p>
        </div>
      )}

      {/* Preview & Mapping Review Table */}
      {mappings.length > 0 && !isAnalyzing && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                <span>ผลการจับคู่อัตโนมัติ (พบ {mappings.length} จุด)</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  ตรวจสอบก่อนบันทึก
                </span>
              </h4>
              <p className="text-xs text-muted mt-0.5">
                AI แนะนำตัวแปรที่เหมาะสมให้แล้ว คุณสามารถปรับเปลี่ยนตัวแปรในช่อง Dropdown ได้ตามต้องการ
              </p>
            </div>

            <div className="w-full sm:w-72">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                ชื่อเทมเพลตที่จะบันทึก :
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-ink focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-700">
                  <th className="py-2.5 px-3 font-bold w-12 text-center">ลำดับ</th>
                  <th className="py-2.5 px-3 font-bold">บริบทในเอกสาร Word</th>
                  <th className="py-2.5 px-3 font-bold w-64">ตัวแปรระบบที่จะแทนที่</th>
                  <th className="py-2.5 px-3 font-bold w-28 text-center">ความมั่นใจ</th>
                  <th className="py-2.5 px-3 font-bold hidden md:table-cell">เหตุผลจาก AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mappings.map((m, idx) => {
                  const currentSelected = selectedTags[m.slot_id] || ""
                  const isHighConfidence = m.confidence >= 0.85
                  return (
                    <tr key={m.slot_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-500 font-bold">
                        {idx + 1}
                      </td>

                      {/* Context */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-ink">
                          {m.context.split("[____]").map((part, i) => (
                            <React.Fragment key={i}>
                              {part}
                              {i === 0 && (
                                <span className="inline-block px-1.5 py-0.5 mx-1 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                                  {m.matched_pattern.slice(0, 8)}...
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          ตำแหน่ง: {m.location_type.startsWith("table") ? "ในตาราง" : "ย่อหน้าเนื้อหา"}
                        </span>
                      </td>

                      {/* Tag Dropdown */}
                      <td className="py-3 px-3">
                        <select
                          value={currentSelected}
                          onChange={(e) => handleTagChange(m.slot_id, e.target.value)}
                          className={`w-full rounded-lg border p-1.5 text-xs font-mono font-medium focus:outline-none ${
                            currentSelected
                              ? "border-emerald-300 bg-emerald-50/50 text-emerald-950"
                              : "border-slate-300 bg-white text-slate-500"
                          }`}
                        >
                          <option value="">-- ไม่ต้องการแทนที่ --</option>
                          {availableTags.map((t) => (
                            <option key={t.tag} value={t.tag}>
                              {`{{${t.tag}}}`} - {t.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Confidence Badge */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            isHighConfidence
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {Math.round(m.confidence * 100)}%
                        </span>
                      </td>

                      {/* AI Reason */}
                      <td className="py-3 px-3 text-slate-500 text-[11px] hidden md:table-cell">
                        {m.reason}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTest}
              disabled={isDownloading || isSaving}
              className="w-full sm:w-auto"
            >
              {isDownloading ? (
                "กำลังดาวน์โหลด..."
              ) : (
                <>
                  <Icon name="download" size={16} />
                  <span>ดาวน์โหลดไฟล์ทดสอบ (.docx)</span>
                </>
              )}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmSave}
              disabled={isSaving || isDownloading}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                "กำลังบันทึกเทมเพลต..."
              ) : (
                <>
                  <Icon name="check" size={16} />
                  <span>บันทึกเป็น Template ประจำปี</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
