/**
 * getEntityContent.js
 *
 * Pure UI helpers for the subscription plans page.
 * All pricing and plan data comes EXCLUSIVELY from the Cloudflare Worker API.
 * This file contains zero hardcoded prices, features, or plan definitions.
 */

/**
 * Parse a student/entity type string into { entity, role }.
 *
 * @param {string} studentType - e.g. "college-student", "admin", "university-educator"
 * @returns {{ entity: string, role: string }}
 */
export function parseStudentType(studentType) {
    if (!studentType) return { entity: 'school', role: 'student' };

    // Simple types
    if (studentType === 'student' || studentType === 'school') return { entity: 'school', role: 'student' };
    if (studentType === 'college') return { entity: 'college', role: 'student' };
    if (studentType === 'university') return { entity: 'university', role: 'student' };
    if (studentType === 'educator') return { entity: 'school', role: 'educator' };
    if (studentType === 'admin') return { entity: 'school', role: 'admin' };
    if (studentType === 'recruiter') return { entity: 'recruitment', role: 'recruiter' };

    // Underscore-separated types (from DB roles and protected-route redirects)
    if (studentType === 'school_admin') return { entity: 'school', role: 'admin' };
    if (studentType === 'college_admin') return { entity: 'college', role: 'admin' };
    if (studentType === 'university_admin') return { entity: 'university', role: 'admin' };
    if (studentType === 'school_student') return { entity: 'school', role: 'student' };
    if (studentType === 'college_student') return { entity: 'college', role: 'student' };
    if (studentType === 'school_educator') return { entity: 'school', role: 'educator' };
    if (studentType === 'college_educator') return { entity: 'college', role: 'educator' };
    if (studentType === 'university_educator') return { entity: 'university', role: 'educator' };

    // Hyphen-separated types (e.g. school-admin, college-student)
    if (studentType.includes('-')) {
        const parts = studentType.split('-');
        if (parts.length === 2) {
            const [entity, role] = parts;
            return { entity, role };
        }
    }

    return { entity: 'school', role: 'student' };
}

/**
 * Get page-level content (title, subtitle, CTA text) for the subscription plans page.
 * This is purely UI text — no pricing or plan data.
 *
 * @param {string} studentType
 * @returns {{ title: string, subtitle: string, heroMessage: null, ctaText: string, entity: string, role: string }}
 */
export function getEntityContent(studentType) {
    const { entity, role } = parseStudentType(studentType);

    const entityNames = {
        school: 'School',
        college: 'College',
        university: 'University',
        recruitment: 'Recruitment',
    };

    const roleNames = {
        student: 'Student',
        educator: 'Educator',
        admin: 'Admin',
        recruiter: 'Recruiter',
    };

    const entityName = entityNames[entity] || 'School';
    const roleName = roleNames[role] || 'Student';

    let title;
    if (entity === 'recruitment') {
        title = role === 'admin' ? 'Recruitment Admin Subscription Plans' : 'Recruiter Subscription Plans';
    } else {
        title = `${entityName} ${roleName} Subscription Plans`;
    }

    let subtitle;
    if (entity === 'recruitment') {
        if (role === 'admin') {
            subtitle = 'Manage your recruitment team effectively with comprehensive tools built for recruitment administrators';
        } else if (role === 'recruiter') {
            subtitle = 'Access verified candidates and streamline your hiring process with powerful recruitment tools';
        } else {
            subtitle = 'Select the plan that best suits your needs';
        }
    } else if (entity === 'university' && role === 'admin') {
        subtitle = 'Manage your university college with powerful tools for student management, placements, and analytics';
    } else if (entity === 'university' && role === 'student') {
        subtitle = 'Access skill assessments, build your portfolio, and connect with top recruiters through your university';
    } else {
        const subtitles = {
            student: `Unlock your potential with skill assessments and career opportunities tailored for ${entityName.toLowerCase()} students`,
            educator: `Empower your students with powerful teaching tools and analytics designed for ${entityName.toLowerCase()} educators`,
            admin: `Manage your institution effectively with comprehensive tools built for ${entityName.toLowerCase()} administrators`,
        };
        subtitle = subtitles[role] || 'Select the plan that best suits your needs';
    }

    const ctaTexts = {
        student: 'Start Learning',
        educator: 'Empower Students',
        admin: 'Manage Institution',
        recruiter: 'Start Hiring',
    };

    return {
        title,
        subtitle,
        heroMessage: null,
        ctaText: ctaTexts[role] || 'Select Plan',
        entity,
        role,
    };
}

/**
 * Map a role type string to the Cloudflare Worker's roleType query parameter.
 * Used to filter plans by target role from the API.
 *
 * @param {string} role - Parsed role from parseStudentType
 * @returns {string} roleType query param value
 */
export function getRoleTypeParam(role) {
    const map = {
        student: 'student',
        educator: 'educator',
        admin: 'admin',
        recruiter: 'recruiter',
    };
    return map[role] || 'all';
}

/**
 * Map an entity type string to the Cloudflare Worker's entityType query parameter.
 *
 * @param {string} entity - Parsed entity from parseStudentType
 * @returns {string} entityType query param value
 */
export function getEntityTypeParam(entity) {
    const map = {
        school: 'school',
        college: 'college',
        university: 'university',
        recruitment: 'recruitment',
    };
    return map[entity] || 'all';
}
