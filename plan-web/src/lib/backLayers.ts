import { useEffect, useRef } from "react"

// ปุ่มย้อนกลับของมือถือ (Android) และของเบราว์เซอร์: ปิดชั้นที่เปิดซ้อนอยู่ (แผ่นเมนู ช่องค้นหา รายละเอียดงาน) ก่อนออกจากหน้า
// ชั้นที่เปิดเพิ่มรายการใน history หนึ่งรายการ (state.layer = ลำดับชั้น) — กดย้อนกลับ = ปิดชั้นบนสุด
// ใช้ useBackLayer กับ component ที่ mount ค้างไว้แล้วสลับ open (ไม่ใช่ mount ตอนเปิด) เพื่อไม่ให้ StrictMode เพิ่มรายการซ้ำ

interface Layer {
  close: () => void
}

let layers: Layer[] = []
let listening = false

function closeLayersAbove() {
  const depth = Number(history.state?.layer ?? 0)
  while (layers.length > depth) layers.pop()!.close()
}

export function useBackLayer(open: boolean, close: () => void) {
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  })

  useEffect(() => {
    if (!open) return
    if (!listening) {
      window.addEventListener("popstate", closeLayersAbove)
      listening = true
    }
    const layer: Layer = { close: () => closeRef.current() }
    layers.push(layer)
    history.pushState({ ...history.state, layer: layers.length }, "")
    return () => {
      const index = layers.indexOf(layer)
      // ไม่อยู่ในรายการแล้ว = ปิดด้วยปุ่มย้อนกลับ หรือถูกแทนที่ด้วยการเปลี่ยนหน้า (dropLayers)
      if (index === -1) return
      layers.splice(index, 1)
      history.back()
    }
  }, [open])
}

/** มีชั้นเปิดอยู่ไหม */
export function hasOpenLayer(): boolean {
  return layers.length > 0
}

/**
 * เปลี่ยนหน้าขณะมีชั้นเปิดอยู่: ทิ้งชั้นทั้งหมดโดยไม่ย้อน history
 * คืน true = รายการบนสุดของ history เป็นของชั้น → ให้แทนที่ (replaceState) แทนการเพิ่มรายการ
 */
export function dropLayers(): boolean {
  const had = layers.length > 0
  layers = []
  return had
}
