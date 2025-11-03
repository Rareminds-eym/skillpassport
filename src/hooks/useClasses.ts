import { useCallback, useEffect, useMemo, useState } from "react"
import { EducatorClass, fetchEducatorClasses } from "../services/classService"

export function useClasses() {
  const [classes, setClasses] = useState<EducatorClass[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadClasses = useCallback(async () => {
    setLoading(true)
    const { data, error: serviceError } = await fetchEducatorClasses()
    if (serviceError || !data) {
      setError(serviceError || "Failed to load classes")
      setClasses([])
    } else {
      setClasses(data)
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  const upsertClass = useCallback((updated: EducatorClass) => {
    setClasses((prev) => {
      const exists = prev.find((item) => item.id === updated.id)
      if (!exists) return [updated, ...prev]
      return prev.map((item) => (item.id === updated.id ? updated : item))
    })
  }, [])

  const stats = useMemo(() => {
    const total = classes.length
    const activeCount = classes.filter((item) => item.status === "Active").length
    return { total, activeCount }
  }, [classes])

  return { classes, loading, error, stats, refresh: loadClasses, upsertClass }
}
