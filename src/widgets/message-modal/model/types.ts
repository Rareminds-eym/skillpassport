/**
 * Message Modal Widget Types
 */

export interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  learner?: any
  userRole?: 'school_admin' | 'college_admin' | 'university_admin' | 'educator'
}
