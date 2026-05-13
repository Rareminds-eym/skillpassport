/**
 * Learner Profile Drawer Widget Types
 */

export interface LearnerProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  learner: any
  userRole: 'school_admin' | 'college_admin' | 'university_admin' | 'educator'
  defaultTab?: string
}
