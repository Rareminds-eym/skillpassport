/**
 * Student Profile Drawer Widget Types
 */

export interface StudentProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  student: any
  userRole: 'school_admin' | 'college_admin' | 'university_admin' | 'educator'
  defaultTab?: string
}
