import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  getCollegeLecturerProgramSections, 
  getCollegeDepartments,
  createProgramSection,
  unassignLecturerFromProgramSection,
  ProgramSection 
} from '../services/programService'

export const useProgramSections = () => {
  const { user } = useAuth()
  const [programSections, setProgramSections] = useState<ProgramSection[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProgramSections = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getCollegeLecturerProgramSections(user.id)
      
      if (fetchError) {
        setError(fetchError)
      } else {
        setProgramSections(data || [])
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch program sections')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async (collegeId: string) => {
    try {
      const { data, error: fetchError } = await getCollegeDepartments(collegeId)
      
      if (fetchError) {
        setError(fetchError)
      } else {
        setDepartments(data || [])
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch departments')
    }
  }

  const createNewProgramSection = async (
    departmentId: string,
    programData: { name: string; code: string; degree_level: string },
    sectionData: { semester: number; section: string; academic_year: string; max_students: number; status: string }
  ) => {
    if (!user?.id) return false

    try {
      const { data, error: createError } = await createProgramSection(
        departmentId,
        programData,
        sectionData,
        user.id
      )
      
      if (createError) {
        setError(createError)
        return false
      }

      // Refresh the lists
      await fetchProgramSections()
      return true
    } catch (err: any) {
      setError(err?.message || 'Failed to create program section')
      return false
    }
  }

  const unassignFromSection = async (programSectionId: string) => {
    try {
      const { data, error: unassignError } = await unassignLecturerFromProgramSection(programSectionId)
      
      if (unassignError) {
        setError(unassignError)
        return false
      }

      // Refresh the lists
      await fetchProgramSections()
      return true
    } catch (err: any) {
      setError(err?.message || 'Failed to unassign from section')
      return false
    }
  }

  useEffect(() => {
    fetchProgramSections()
  }, [user?.id])

  return {
    programSections,
    departments,
    loading,
    error,
    fetchProgramSections,
    fetchDepartments,
    createNewProgramSection,
    unassignFromSection,
    refetch: fetchProgramSections
  }
}