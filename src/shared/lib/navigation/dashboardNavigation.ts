import { NavigateFunction } from 'react-router-dom';

/**
 * Navigate to the main learner dashboard
 * @param navigate - React Router navigate function
 */
export const navigateToDashboard = (navigate: NavigateFunction): void => {
    navigate('/learner/dashboard');
};

/**
 * Navigate to the learner profile page
 * @param navigate - React Router navigate function
 */
export const navigateToProfile = (navigate: NavigateFunction): void => {
    navigate('/learner/profile');
};

/**
 * Navigate to the learner skills page
 * @param navigate - React Router navigate function
 */
export const navigateToSkills = (navigate: NavigateFunction): void => {
    navigate('/learner/skills');
};

/**
 * Navigate to the learner courses page
 * @param navigate - React Router navigate function
 */
export const navigateToCourses = (navigate: NavigateFunction): void => {
    navigate('/learner/courses');
};

/**
 * Navigate to the learner opportunities page
 * @param navigate - React Router navigate function
 */
export const navigateToOpportunities = (navigate: NavigateFunction): void => {
    navigate('/learner/opportunities');
};

/**
 * Navigate to the learner achievements page
 * @param navigate - React Router navigate function
 */
export const navigateToAchievements = (navigate: NavigateFunction): void => {
    navigate('/learner/achievements');
};

/**
 * Navigate to continue a specific learning path
 * @param navigate - React Router navigate function
 * @param pathId - The ID of the learning path to continue
 */
export const navigateToLearningPath = (navigate: NavigateFunction, pathId: string): void => {
    navigate(`/learner/learning-path/${pathId}/continue`);
};

/**
 * Navigate to the learning paths selection page
 * @param navigate - React Router navigate function
 */
export const navigateToLearningPaths = (navigate: NavigateFunction): void => {
    navigate('/learner/learning-paths');
};

/**
 * Navigate to skill improvement page, optionally for a specific skill
 * @param navigate - React Router navigate function
 * @param skillId - Optional skill ID to improve a specific skill
 */
export const navigateToSkillImprovement = (navigate: NavigateFunction, skillId?: string): void => {
    if (skillId) {
        navigate(`/learner/skills/${skillId}/improve`);
    } else {
        navigate('/learner/skills/improve');
    }
};

/**
 * Navigate to the learner portfolio page
 * @param navigate - React Router navigate function
 */
export const navigateToPortfolio = (navigate: NavigateFunction): void => {
    navigate('/learner/portfolio');
};

/**
 * Navigate to the opportunity application page
 * @param navigate - React Router navigate function
 * @param opportunityId - The ID of the opportunity to apply for
 */
export const navigateToOpportunityApplication = (
    navigate: NavigateFunction,
    opportunityId: string
): void => {
    navigate(`/learner/opportunities/${opportunityId}/apply`);
};
