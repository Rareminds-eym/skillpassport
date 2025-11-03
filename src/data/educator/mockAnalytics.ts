export interface SkillSummary {
  category: string;
  totalActivities: number;
  verifiedActivities: number;
  participationRate: number;
  avgScore: number;
}

export interface AttendanceData {
  month: string;
  present: number;
  absent: number;
  late: number;
}

export interface SkillGrowthData {
  month: string;
  technical: number;
  communication: number;
  leadership: number;
  creativity: number;
}

export interface LeaderboardEntry {
  rank: number;
  studentName: string;
  studentId: string;
  totalActivities: number;
  verifiedActivities: number;
  awards: number;
  progress: number;
  avatar?: string;
}

export interface ActivityHeatmapData {
  date: string;
  count: number;
}

export const mockSkillSummary: SkillSummary[] = [
  {
    category: 'Technical Skills',
    totalActivities: 145,
    verifiedActivities: 132,
    participationRate: 85,
    avgScore: 4.2,
  },
  {
    category: 'Communication',
    totalActivities: 98,
    verifiedActivities: 92,
    participationRate: 78,
    avgScore: 4.5,
  },
  {
    category: 'Leadership',
    totalActivities: 67,
    verifiedActivities: 61,
    participationRate: 65,
    avgScore: 4.1,
  },
  {
    category: 'Creativity',
    totalActivities: 123,
    verifiedActivities: 115,
    participationRate: 82,
    avgScore: 4.3,
  },
  {
    category: 'Problem Solving',
    totalActivities: 89,
    verifiedActivities: 84,
    participationRate: 72,
    avgScore: 4.0,
  },
  {
    category: 'Teamwork',
    totalActivities: 112,
    verifiedActivities: 105,
    participationRate: 80,
    avgScore: 4.4,
  },
];

export const mockAttendanceData: AttendanceData[] = [
  { month: 'Jan', present: 92, absent: 5, late: 3 },
  { month: 'Feb', present: 88, absent: 8, late: 4 },
  { month: 'Mar', present: 95, absent: 3, late: 2 },
  { month: 'Apr', present: 90, absent: 6, late: 4 },
  { month: 'May', present: 94, absent: 4, late: 2 },
  { month: 'Jun', present: 89, absent: 7, late: 4 },
  { month: 'Jul', present: 93, absent: 5, late: 2 },
  { month: 'Aug', present: 96, absent: 2, late: 2 },
  { month: 'Sep', present: 91, absent: 6, late: 3 },
  { month: 'Oct', present: 94, absent: 4, late: 2 },
];

export const mockSkillGrowthData: SkillGrowthData[] = [
  { month: 'Jan', technical: 65, communication: 70, leadership: 60, creativity: 75 },
  { month: 'Feb', technical: 68, communication: 72, leadership: 62, creativity: 78 },
  { month: 'Mar', technical: 72, communication: 75, leadership: 65, creativity: 80 },
  { month: 'Apr', technical: 75, communication: 78, leadership: 68, creativity: 82 },
  { month: 'May', technical: 78, communication: 80, leadership: 72, creativity: 85 },
  { month: 'Jun', technical: 82, communication: 83, leadership: 75, creativity: 87 },
  { month: 'Jul', technical: 85, communication: 85, leadership: 78, creativity: 89 },
  { month: 'Aug', technical: 88, communication: 87, leadership: 82, creativity: 91 },
  { month: 'Sep', technical: 90, communication: 89, leadership: 85, creativity: 93 },
  { month: 'Oct', technical: 92, communication: 91, leadership: 88, creativity: 95 },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    studentName: 'Priya Sharma',
    studentId: 'STD001',
    totalActivities: 45,
    verifiedActivities: 43,
    awards: 12,
    progress: 95,
  },
  {
    rank: 2,
    studentName: 'Rahul Kumar',
    studentId: 'STD002',
    totalActivities: 42,
    verifiedActivities: 40,
    awards: 10,
    progress: 92,
  },
  {
    rank: 3,
    studentName: 'Ananya Singh',
    studentId: 'STD003',
    totalActivities: 40,
    verifiedActivities: 38,
    awards: 9,
    progress: 90,
  },
  {
    rank: 4,
    studentName: 'Arjun Patel',
    studentId: 'STD004',
    totalActivities: 38,
    verifiedActivities: 36,
    awards: 8,
    progress: 88,
  },
  {
    rank: 5,
    studentName: 'Diya Mehta',
    studentId: 'STD005',
    totalActivities: 36,
    verifiedActivities: 35,
    awards: 7,
    progress: 85,
  },
  {
    rank: 6,
    studentName: 'Rohan Verma',
    studentId: 'STD006',
    totalActivities: 34,
    verifiedActivities: 32,
    awards: 6,
    progress: 82,
  },
  {
    rank: 7,
    studentName: 'Kavya Reddy',
    studentId: 'STD007',
    totalActivities: 32,
    verifiedActivities: 30,
    awards: 6,
    progress: 80,
  },
  {
    rank: 8,
    studentName: 'Aditya Joshi',
    studentId: 'STD008',
    totalActivities: 30,
    verifiedActivities: 28,
    awards: 5,
    progress: 78,
  },
  {
    rank: 9,
    studentName: 'Ishita Gupta',
    studentId: 'STD009',
    totalActivities: 28,
    verifiedActivities: 27,
    awards: 5,
    progress: 75,
  },
  {
    rank: 10,
    studentName: 'Vivek Rao',
    studentId: 'STD010',
    totalActivities: 26,
    verifiedActivities: 25,
    awards: 4,
    progress: 72,
  },
];

// Generate heatmap data for the last 90 days
export const generateActivityHeatmap = (): ActivityHeatmapData[] => {
  const data: ActivityHeatmapData[] = [];
  const today = new Date();
  
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = Math.floor(Math.random() * 15); // Random activity count 0-14
    data.push({ date: dateStr, count });
  }
  
  return data;
};

export const mockActivityHeatmap = generateActivityHeatmap();

export interface AnalyticsKPIs {
  activeStudents: number;
  totalVerifiedActivities: number;
  pendingVerifications: number;
  avgSkillsPerStudent: number;
  attendanceRate: number;
  engagementRate: number;
}

export const mockAnalyticsKPIs: AnalyticsKPIs = {
  activeStudents: 156,
  totalVerifiedActivities: 634,
  pendingVerifications: 42,
  avgSkillsPerStudent: 4.1,
  attendanceRate: 93.2,
  engagementRate: 87.5,
};
