import { apiPost } from '@/shared/api/apiClient';

export interface Competition {
    comp_id: string;
    school_id: string;
    name: string;
    description?: string;
    level: 'intraschool' | 'interschool' | 'district' | 'state' | 'national' | 'international';
    category?: string;
    competition_date: string;
    registration_deadline?: string;
    venue?: string;
    team_size_min: number;
    team_size_max: number;
    eligibility_criteria?: string;
    rules?: string;
    prizes?: any;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string;
    participatingClubs?: string[];
    results?: any[];
}

export interface CompetitionRegistration {
    registration_id: string;
    comp_id: string;
    learner_email: string;
    team_name?: string;
    team_members?: any;
    registration_date: string;
    status: 'registered' | 'confirmed' | 'withdrawn' | 'disqualified';
    notes?: string;
    special_requirements?: string;
}

export interface CompetitionResult {
    result_id: string;
    comp_id: string;
    learner_email: string;
    rank?: number;
    score?: number;
    award?: string;
    category?: string;
    performance_notes?: string;
    certificate_issued: boolean;
}

export async function fetchCompetitions(): Promise<Competition[]> {
    try {
        const result: any = await apiPost('/college-admin/competitions', { action: 'get-all' });
        return result.data || [];
    } catch (error) {
        throw error;
    }
}

export async function createCompetition(competitionData: {
    name: string;
    level: string;
    date: string;
    participatingClubs?: string[];
    description?: string;
    category?: string;
    status?: string;
}): Promise<Competition> {
    try {
        const result: any = await apiPost('/college-admin/competitions', { action: 'create', ...competitionData });
        return result.data;
    } catch (error) {
        throw error;
    }
}

export async function registerForCompetition(
    compId: string,
    learnerEmail: string,
    registrationData: {
        learnerName: string;
        learnerId: string;
        grade: string;
        teamMembers?: string;
        notes?: string;
    }
): Promise<CompetitionRegistration> {
    try {
        const result: any = await apiPost('/college-admin/competitions', {
            action: 'register',
            comp_id: compId,
            learner_email: learnerEmail,
            team_members: registrationData.teamMembers
                ? { members: registrationData.teamMembers.split(',').map(m => m.trim()) }
                : null,
            notes: registrationData.notes,
        });
        return result.data;
    } catch (error) {
        throw error;
    }
}

export async function getCompetitionRegistrations(compId: string): Promise<CompetitionRegistration[]> {
    try {
        const result: any = await apiPost('/college-admin/competitions', { action: 'get-registrations', comp_id: compId });
        return result.data || [];
    } catch (error) {
        throw error;
    }
}

export async function addCompetitionResult(
    compId: string,
    learnerEmail: string,
    resultData: {
        rank?: number;
        score?: number;
        award?: string;
        category?: string;
        performance_notes?: string;
    }
): Promise<CompetitionResult> {
    try {
        const result: any = await apiPost('/college-admin/competitions', {
            action: 'add-result',
            comp_id: compId,
            learner_email: learnerEmail,
            ...resultData,
        });
        return result.data;
    } catch (error) {
        throw error;
    }
}

export async function getCompetitionResults(compId: string): Promise<CompetitionResult[]> {
    try {
        const result: any = await apiPost('/college-admin/competitions', { action: 'get-results', comp_id: compId });
        return result.data || [];
    } catch (error) {
        throw error;
    }
}

export async function updateCompetitionRegistration(
    registrationId: string,
    updateData: {
        teamMembers?: string;
        notes?: string;
    }
): Promise<void> {
    try {
        await apiPost('/college-admin/competitions', {
            action: 'update-registration',
            registration_id: registrationId,
            team_members: updateData.teamMembers
                ? { members: updateData.teamMembers.split(',').map(m => m.trim()).filter(m => m) }
                : undefined,
            notes: updateData.notes,
        });
    } catch (error) {
        throw error;
    }
}

export async function deleteCompetitionRegistration(registrationId: string): Promise<void> {
    try {
        await apiPost('/college-admin/competitions', { action: 'delete-registration', registration_id: registrationId });
    } catch (error) {
        throw error;
    }
}

export async function updateCompetition(
    compId: string,
    updateData: {
        name?: string;
        level?: string;
        date?: string;
        description?: string;
        category?: string;
        status?: string;
        participatingClubs?: string[];
    }
): Promise<void> {
    try {
        await apiPost('/college-admin/competitions', { action: 'update', comp_id: compId, ...updateData });
    } catch (error) {
        throw error;
    }
}

export async function deleteCompetition(compId: string): Promise<void> {
    try {
        await apiPost('/college-admin/competitions', { action: 'delete', comp_id: compId });
    } catch (error) {
        throw error;
    }
}
