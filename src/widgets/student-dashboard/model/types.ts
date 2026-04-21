export interface StudentDashboardWidgetProps {
  studentId?: string;
  showAnalytics?: boolean;
}

export interface DashboardSection {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}
