import { useEffect, useState } from "react"
import { ApiError } from "../lib/api"
import { getFiscalYearConfig } from "../services/fiscalYearService"
import { FiscalYearConfig } from "../types/plan"

export function useFiscalYearConfig(year: number): {
  config: FiscalYearConfig | null
  loading: boolean
  error: string | null
} {
  const [config, setConfig] = useState<FiscalYearConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getFiscalYearConfig(year)
      .then((loaded) => {
        if (!cancelled) setConfig(loaded)
      })
      .catch((e) => {
        if (cancelled) return
        setConfig(null)
        setError(e instanceof ApiError ? e.detail : `โหลดข้อมูลปีงบประมาณ ${year} ไม่สำเร็จ`)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [year])

  return { config, loading, error }
}
