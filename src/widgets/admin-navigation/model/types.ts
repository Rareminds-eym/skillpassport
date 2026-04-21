/**
 * Admin Navigation Widget Types
 */

export interface AdminNavigationProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
  showMobileMenu?: boolean
  onMobileMenuToggle?: () => void
}
