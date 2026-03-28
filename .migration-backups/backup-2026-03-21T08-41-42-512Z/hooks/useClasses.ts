import { useCallback, useEffect, useMemo, useState } from "react"
import { EducatorClass, fetchEducatorClasses } from "../services/classService"

interface UseClassesOptions {
  schoolId?: string | null;
  collegeId?: string | null;
  educatorId?: string | null;
  educatorType?: 'school' | 'college' | null;
}

export function useClasses(options?: UseClassesOptions) {
  const [classes, setClasses] = useState<EducatorClass[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const schoolId = options?.schoolId
  const collegeId = options?.collegeId
  const educatorId = options?.educatorId
  const educatorType = options?.educatorType

  const loadClasses = async () => {
    setLoading(true)
    
    // Security: Ensure educatorId and educatorType are provided for educator role
    if (options?.educatorId === undefined || options?.educatorType === undefined) {
      setError("Educator ID and type are required")
      setClasses([])
      setLoading(false)
      return
    }
    
    const { data, error: serviceError } = await fetchEducatorClasses(
      schoolId || undefined, 
      collegeId || undefined,
      educatorId || undefined,
      educatorType || undefined
    )
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
      
      // Security: Don't load classes without proper educator identification
      if (options?.educatorId === undefined || options?.educatorType === undefined) {
        setError("Educator authentication required")
        setClasses([])
        setLoading(false)
        return
      }
      
      // Wait for schoolId or collegeId if options are provided
      if (options !== undefined && (educatorType === 'school' ? schoolId === undefined : collegeId === undefined)) {
        return
      }
      
      await loadClasses()
    }
    wrappedLoad()
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, collegeId, educatorId, educatorType])

  const upsertClass = useCallback((updated: EducatorClass) => {
    setClasses((prev) => {
      const exists = prev.find((item) => item.id === updated.id)
      if (!exists) return [updated, ...prev]
      return prev.map((item) => (item.id === updated.id ? updated : item))
    })
  }, [])

  const refresh = useCallback(() => {
    loadClasses()
  }, [schoolId, collegeId, educatorId, educatorType])

  const stats = useMemo(() => {
    const total = classes.length
    const activeCount = classes.filter((item) => item.status === "Active").length
    return { total, activeCount }
  }, [classes])

  return { classes, loading, error, stats, refresh, upsertClass }
}
