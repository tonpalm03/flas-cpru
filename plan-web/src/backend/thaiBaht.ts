/** จำนวนเงินเป็นตัวหนังสือภาษาไทย เช่น 68400 → หกหมื่นแปดพันสี่ร้อยบาทถ้วน (จาก backend/services/thai_baht.py) */

const DIGITS = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"]
const UNITS = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"]

function readBelowMillion(value: number, hasHigher = false): string {
  let out = ""
  const digits = String(value)
  const length = digits.length
  for (let position = 0; position < length; position++) {
    const digit = Number(digits[position])
    const unit = length - 1 - position
    if (digit === 0) continue
    if (unit === 1 && digit === 1) out += "สิบ"
    else if (unit === 1 && digit === 2) out += "ยี่สิบ"
    else if (unit === 0 && digit === 1 && (length > 1 || hasHigher)) out += "เอ็ด"
    else out += DIGITS[digit] + UNITS[unit]
  }
  return out
}

function readNumber(value: number): string {
  if (value >= 1_000_000) return readNumber(Math.floor(value / 1_000_000)) + "ล้าน" + readBelowMillion(value % 1_000_000, true)
  return readBelowMillion(value)
}

export function bahtText(amount: number): string {
  if (amount < 0) return "ลบ" + bahtText(-amount)
  const satangTotal = Math.round(amount * 100)
  const baht = Math.floor(satangTotal / 100)
  const satang = satangTotal % 100
  const bahtPart = (readNumber(baht) || "ศูนย์") + "บาท"
  if (satang === 0) return bahtPart + "ถ้วน"
  return bahtPart + readNumber(satang) + "สตางค์"
}
