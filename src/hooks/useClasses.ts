import { useCallback, useEffect, useMemo, useState } from "react"
import { EducatorClass, fetchEducatorClasses } from "../services/classService"

interface UseClassesOptions {
  schoolId?: string | null;
  educatorId?: string | null;
}

export function useClasses(options?: UseClassesOptions) {
  const [classes, setClasses] = useState<EducatorClass[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const schoolId = options?.schoolId
  const educatorId = options?.educatorId

  const loadClasses = async () => {
    setLoading(true)
    const { data, error: serviceError } = await fetchEducatorClasses(schoolId || undefined, educatorId || undefined)
    if (serviceError || !data) {
      setError(serviceError || "Failed to load classes")
      setClasses([])
    } else {
      setClasses(data)
      setError(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    let isMounted = true
    const wrappedLoad = async () => {
      if (!isMounted) return
      // Wait for schoolId if options are provided
      if (options !== undefined && schoolId === undefined) {
        return
      }
      await loadClasses()
    }
    wrappedLoad()
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, educatorId])

  const upsertClass = useCallback((updated: EducatorClass) => {
    setClasses((prev) => {
      const exists = prev.find((item) => item.id === updated.id)
      if (!exists) return [updated, ...prev]
      return prev.map((item) => (item.id === updated.id ? updated : item))
    })
  }, [])

  const refresh = useCallback(() => {
    loadClasses()
  }, [schoolId, educatorId])

  const stats = useMemo(() => {
    const total = classes.length
    const activeCount = classes.filter((item) => item.status === "Active").length
    return { total, activeCount }
  }, [classes])

  return { classes, loading, error, stats, refresh, upsertClass }
}
