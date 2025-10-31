import { useEffect, useMemo, useState } from "react"

export type ClassStatus = "Active" | "Completed" | "Upcoming"

export interface EducatorClass {
  id: string
  name: string
  course: string
  educator: string
  department: string
  year: string
  status: ClassStatus
  total_students: number
  avg_progress: number
}

const MOCK_CLASSES: EducatorClass[] = [
  {
    id: "cls-001",
    name: "AI Fundamentals - Batch 2025",
    course: "Artificial Intelligence",
    educator: "Dr. Asha Raman",
    department: "Computer Science",
    year: "2025",
    status: "Active",
    total_students: 42,
    avg_progress: 76
  },
  {
    id: "cls-002",
    name: "Data Structures Workshop",
    course: "Data Structures",
    educator: "Prof. Karthik Rao",
    department: "Computer Science",
    year: "2024",
    status: "Completed",
    total_students: 38,
    avg_progress: 91
  },
  {
    id: "cls-003",
    name: "Digital Marketing Sprint",
    course: "Marketing Analytics",
    educator: "Anita Desai",
    department: "Management",
    year: "2025",
    status: "Active",
    total_students: 56,
    avg_progress: 64
  },
  {
    id: "cls-004",
    name: "Cloud Computing Essentials",
    course: "Cloud Platforms",
    educator: "Sanjay Gupta",
    department: "Information Technology",
    year: "2026",
    status: "Upcoming",
    total_students: 48,
    avg_progress: 0
  },
  {
    id: "cls-005",
    name: "Product Design Studio",
    course: "Design Thinking",
    educator: "Rhea Malhotra",
    department: "Design",
    year: "2024",
    status: "Completed",
    total_students: 32,
    avg_progress: 88
  },
  {
    id: "cls-006",
    name: "Entrepreneurship Lab",
    course: "Startup Management",
    educator: "Rahul Mehta",
    department: "Management",
    year: "2025",
    status: "Active",
    total_students: 27,
    avg_progress: 71
  }
]

export function useClasses() {
  const [classes, setClasses] = useState<EducatorClass[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    const timer = setTimeout(() => {
      if (!active) return
      try {
        setClasses(MOCK_CLASSES)
        setError(null)
      } catch (err) {
        setError("Failed to load classes")
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [])

  const stats = useMemo(() => {
    const total = classes.length
    const activeCount = classes.filter(item => item.status === "Active").length
    return { total, activeCount }
  }, [classes])

  return { classes, loading, error, stats }
}
