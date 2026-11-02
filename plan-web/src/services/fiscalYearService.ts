import { apiJson } from "../lib/api"
import { FiscalYearConfig } from "../types/plan"

const configCache = new Map<number, Promise<FiscalYearConfig>>()

export async function getFiscalYears(): Promise<number[]> {
  return apiJson<number[]>("/fiscal-years")
}

/** config ประจำปีงบ (แหล่งงบ, หมวดรายจ่าย, ประเภทโครงการ, แผนยุทธศาสตร์) — cache ต่อปีระหว่างเปิดหน้าเว็บ */
export function getFiscalYearConfig(year: number): Promise<FiscalYearConfig> {
  let cached = configCache.get(year)
  if (!cached) {
    cached = apiJson<FiscalYearConfig>(`/fiscal-years/${year}/config`)
    cached.catch(() => configCache.delete(year))
    configCache.set(year, cached)
  }
  return cached
}
