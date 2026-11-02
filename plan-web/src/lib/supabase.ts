import { SupabaseClient, createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ltjuemazttczyykflojf.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

/**
 * Supabase ใช้เฉพาะหน้าตั้งค่าฟอร์ม/หมวดงบ (No-Code) — ระบบแผนหลักคุยกับ backend เท่านั้น
 * ไม่ได้ตั้ง VITE_SUPABASE_ANON_KEY (เช่น เครื่อง server ของคณะ): ห้ามสร้าง client ตอนโหลดหน้า
 * (createClient โยน error แล้วทั้งแอปหน้าขาว) — คืนตัวแทนที่โยน error ตอนเรียกใช้ ซึ่งทุกจุดมี try/catch ใช้ค่าในเครื่องแทน
 */
export const supabase: SupabaseClient = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as SupabaseClient, {
      get() {
        throw new Error("ยังไม่ได้ตั้งค่า Supabase (VITE_SUPABASE_ANON_KEY)")
      },
    })
