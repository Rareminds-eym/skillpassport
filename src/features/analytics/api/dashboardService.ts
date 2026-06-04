import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('dashboard-service');

const callDashboard = async <T>(action: string, params?: Record<string, unknown>): Promise<T> => {
  return apiPost<T>('/analytics/dashboard', { action, ...params });
};

const generateRealisticCandidate = () => {
  const firstNames = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Ananya', 'Karthik', 'Deepika', 'Rohan', 'Kavya', 'Aditya', 'Meera', 'Sanjay', 'Riya', 'Varun', 'Ishita'];
  const lastNames = ['Kumar', 'Sharma', 'Singh', 'Reddy', 'Patel', 'Gupta', 'Shah', 'Rao', 'Jain', 'Agarwal', 'Mehta', 'Verma', 'Iyer', 'Nair', 'Pillai', 'Menon'];
  const specializations = ['Computer Science Graduate', 'Software Engineering Learner', 'Data Science Aspirant', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Machine Learning Learner', 'AI/ML Graduate', 'Product Manager', 'UI/UX Designer', 'Business Analyst', 'Quality Assurance Engineer', 'Mobile App Developer'];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const specialization = specializations[Math.floor(Math.random() * specializations.length)];
  return { name: `${firstName} ${lastName.charAt(0)}.`, specialization };
};

export const getDashboardKPIs = async () => {
  try {
    const response: any = await callDashboard('get-kpis');
    return { data: response.data, error: null };
  } catch (error) {
    logger.error('Error fetching dashboard KPIs', error instanceof Error ? error : new Error(String(error)));
    return { data: null, error };
  }
};

export const getRecentActivity = async (limit = 15) => {
  try {
    const response: any = await callDashboard('get-recent-activity', { limit });
    return { data: response.data, error: null };
  } catch (error) {
    logger.error('Error fetching recent activity', error instanceof Error ? error : new Error(String(error)), { limit });
    return { data: [], error };
  }
};

export const getDashboardAlerts = async () => {
  try {
    const response: any = await callDashboard('get-alerts');
    return { data: response.data, error: null };
  } catch (error) {
    logger.error('Error fetching dashboard alerts', error instanceof Error ? error : new Error(String(error)));
    return { data: [], error };
  }
};

export const getRecentShortlists = async (limit = 5) => {
  try {
    const response: any = await callDashboard('get-recent-shortlists', { limit });
    return { data: response.data, error: null };
  } catch (error) {
    logger.error('Error fetching recent shortlists', error instanceof Error ? error : new Error(String(error)), { limit });
    return { data: [], error };
  }
};

export const getSavedSearches = async () => {
  try {
    const response: any = await callDashboard('get-saved-searches');
    return { data: response.data, error: null };
  } catch (error) {
    logger.error('Error fetching saved searches', error instanceof Error ? error : new Error(String(error)));
    return { data: [
      { id: 'default-1', name: 'React + Node.js', search_criteria: { skills: ['React', 'Node.js'] } },
      { id: 'default-2', name: 'Python Developers', search_criteria: { skills: ['Python'] } },
      { id: 'default-3', name: 'Data Science + ML', search_criteria: { skills: ['Data Science', 'Machine Learning'] } },
      { id: 'default-4', name: 'Frontend (React/Angular)', search_criteria: { skills: ['React', 'Angular'] } }
    ], error };
  }
};

export const getDashboardData = async () => {
  try {
    const response: any = await callDashboard('get-dashboard-data');
    return { data: response.data, error: { kpis: null, alerts: null, recentActivity: null, shortlists: null, savedSearches: null } };
  } catch (error) {
    logger.error('Error fetching dashboard data', error instanceof Error ? error : new Error(String(error)));
    return { data: null, error };
  }
};
