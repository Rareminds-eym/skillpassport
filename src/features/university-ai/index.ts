// University AI Feature Exports

export { default as UniversityCounselling } from './components/UniversityCounselling';
export * from './types';
export * from './services/counsellingService';
export * from './config/universityAIConfig';
// API & Data Access
export * from './api';
export { addCollegeToUniversity } from './api/universityCollegeService';
export { updateUniversityCollege } from './api/universityCollegeService';
export { getCollegesByUniversity } from './api/universityCollegeService';
export { getUniversityCollegeStats } from './api/universityCollegeService';
export { checkCollegeCodeUnique } from './api/universityCollegeService';
export { getAvailableColleges } from './api/universityCollegeService';
export { removeCollegeFromUniversity } from './api/universityCollegeService';
