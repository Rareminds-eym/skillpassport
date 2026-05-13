export interface LearnerDashboardWidgetProps {
  learnerId?: string;
  showAnalytics?: boolean;
}

export interface DashboardSection {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}
