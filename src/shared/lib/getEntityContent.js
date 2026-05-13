/**
 * getEntityContent.js
 *
 * Pure UI helpers for the subscription plans page.
 * All pricing and plan data comes EXCLUSIVELY from the Cloudflare Worker API.
 * This file contains zero hardcoded prices, features, or plan definitions.
 */

/**
 * Parse a learner/entity type string into { entity, role }.
 *
 * @param {string} learnerType - e.g. "college-learner", "admin", "university-educator"
 * @returns {{ entity: string, role: string }}
 */
export function parselearnerType(learnerType) {
    if (!learnerType) return { entity: 'school', role: 'learner' };

    // Simple types
    if (learnerType === 'learner' || learnerType === 'school') return { entity: 'school', role: 'learner' };
    if (learnerType === 'college') return { entity: 'college', role: 'learner' };
    if (learnerType === 'university') return { entity: 'university', role: 'learner' };
    if (learnerType === 'educator') return { entity: 'school', role: 'educator' };
    if (learnerType === 'admin') return { entity: 'school', role: 'admin' };
    if (learnerType === 'recruiter') return { entity: 'recruitment', role: 'recruiter' };

    // Underscore-separated types (from DB roles and protected-route redirects)
    if (learnerType === 'school_admin') return { entity: 'school', role: 'admin' };
    if (learnerType === 'college_admin') return { entity: 'college', role: 'admin' };
    if (learnerType === 'university_admin') return { entity: 'university', role: 'admin' };
    if (learnerType === 'learner') return { entity: 'school', role: 'learner' };
    if (learnerType === 'learner') return { entity: 'college', role: 'learner' };
    if (learnerType === 'school_educator') return { entity: 'school', role: 'educator' };
    if (learnerType === 'college_educator') return { entity: 'college', role: 'educator' };
    if (learnerType === 'university_educator') return { entity: 'university', role: 'educator' };

    // Hyphen-separated types (e.g. school-admin, college-learner)
    if (learnerType.includes('-')) {
        const parts = learnerType.split('-');
        if (parts.length === 2) {
            const [entity, role] = parts;
            return { entity, role };
        }
    }

    return { entity: 'school', role: 'learner' };
}

/**
 * Get page-level content (title, subtitle, CTA text) for the subscription plans page.
 * This is purely UI text — no pricing or plan data.
 *
 * @param {string} learnerType
 * @returns {{ title: string, subtitle: string, heroMessage: null, ctaText: string, entity: string, role: string }}
 */
export function getEntityContent(learnerType) {
    const { entity, role } = parselearnerType(learnerType);

    const entityNames = {
        school: 'School',
        college: 'College',
        university: 'University',
        recruitment: 'Recruitment',
    };

    const roleNames = {
        learner: 'Learner',
        educator: 'Educator',
        admin: 'Admin',
        recruiter: 'Recruiter',
    };

    const entityName = entityNames[entity] || 'School';
    const roleName = roleNames[role] || 'Learner';

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
        subtitle = 'Manage your university college with powerful tools for learner management, placements, and analytics';
    } else if (entity === 'university' && role === 'learner') {
        subtitle = 'Access skill assessments, build your portfolio, and connect with top recruiters through your university';
    } else {
        const subtitles = {
            learner: `Unlock your potential with skill assessments and career opportunities tailored for ${entityName.toLowerCase()} learners`,
            educator: `Empower your learners with powerful teaching tools and analytics designed for ${entityName.toLowerCase()} educators`,
            admin: `Manage your institution effectively with comprehensive tools built for ${entityName.toLowerCase()} administrators`,
        };
        subtitle = subtitles[role] || 'Select the plan that best suits your needs';
    }

    const ctaTexts = {
        learner: 'Start Learning',
        educator: 'Empower Learners',
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
 * @param {string} role - Parsed role from parselearnerType
 * @returns {string} roleType query param value
 */
export function getRoleTypeParam(role) {
    const map = {
        learner: 'learner',
        educator: 'educator',
        admin: 'admin',
        recruiter: 'recruiter',
    };
    return map[role] || 'all';
}

/**
 * Map an entity type string to the Cloudflare Worker's entityType query parameter.
 *
 * @param {string} entity - Parsed entity from parselearnerType
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
