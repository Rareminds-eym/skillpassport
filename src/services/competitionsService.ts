import { supabase } from '../lib/supabaseClient';

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
    student_email: string;
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
    student_email: string;
    rank?: number;
    score?: number;
    award?: string;
    category?: string;
    performance_notes?: string;
    certificate_issued: boolean;
}

// Get current user's school_id
async function getCurrentUserSchoolId(): Promise<string | null> {
    try {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) return null;

        // Try school_educators first
        const { data: educatorData } = await supabase
            .from('school_educators')
            .select('school_id')
            .eq('email', userEmail)
            .maybeSingle();

        if (educatorData?.school_id) {
            return educatorData.school_id;
        }

        // Try schools table (for admins)
        const { data: schoolData } = await supabase
            .from('schools')
            .select('id')
            .eq('principal_email', userEmail)
            .maybeSingle();

        return schoolData?.id || null;
    } catch (error) {
        console.error('Error getting school_id:', error);
        return null;
    }
}

// Get current user info for created_by fields
async function getCurrentUserInfo(): Promise<{ type: 'educator' | 'admin', id: string } | null> {
    try {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) return null;

        // Check if educator
        const { data: educatorData } = await supabase
            .from('school_educators')
            .select('id')
            .eq('email', userEmail)
            .maybeSingle();

        if (educatorData?.id) {
            return { type: 'educator', id: educatorData.id };
        }

        // Check if admin
        const { data: schoolData } = await supabase
            .from('schools')
            .select('id')
            .eq('principal_email', userEmail)
            .maybeSingle();

        if (schoolData?.id) {
            return { type: 'admin', id: schoolData.id };
        }

        return null;
    } catch (error) {
        console.error('Error getting user info:', error);
        return null;
    }
}

// Fetch all competitions for current school
export async function fetchCompetitions(): Promise<Competition[]> {
    try {
        const schoolId = await getCurrentUserSchoolId();
        if (!schoolId) {
            throw new Error('School ID not found');
        }

        const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .eq('school_id', schoolId)
            .order('competition_date', { ascending: true });

        if (error) throw error;

        // Fetch participating clubs for each competition
        const competitionsWithClubs = await Promise.all(
            (data || []).map(async (comp) => {
                const { data: clubsData } = await supabase
                    .from('competition_clubs')
                    .select('club_id')
                    .eq('comp_id', comp.comp_id);

                const { data: resultsData } = await supabase
                    .from('competition_results')
                    .select('*')
                    .eq('comp_id', comp.comp_id);

                return {
                    ...comp,
                    participatingClubs: clubsData?.map(c => c.club_id) || [],
                    results: resultsData || []
                };
            })
        );

        return competitionsWithClubs;
    } catch (error) {
        console.error('Error fetching competitions:', error);
        throw error;
    }
}

// Create a new competition
export async function createCompetition(competitionData: {
    name: string;
    level: string;
    date: string;
    participatingClubs?: string[];
    description?: string;
    category?: string;
}): Promise<Competition> {
    try {
        const schoolId = await getCurrentUserSchoolId();
        const userInfo = await getCurrentUserInfo();

        if (!schoolId || !userInfo) {
            throw new Error('User authentication failed');
        }

        const newCompetition = {
            school_id: schoolId,
            name: competitionData.name,
            level: competitionData.level,
            competition_date: competitionData.date,
            description: competitionData.description || '',
            category: competitionData.category || '',
            status: 'upcoming',
            team_size_min: 1,
            team_size_max: 1,
            created_by_type: userInfo.type,
            ...(userInfo.type === 'educator'
                ? { created_by_educator_id: userInfo.id }
                : { created_by_admin_id: userInfo.id }
            )
        };

        const { data, error } = await supabase
            .from('competitions')
            .insert([newCompetition])
            .select()
            .single();

        if (error) throw error;

        // Add participating clubs if provided
        if (competitionData.participatingClubs && competitionData.participatingClubs.length > 0) {
            const clubRecords = competitionData.participatingClubs.map(clubId => ({
                comp_id: data.comp_id,
                club_id: clubId,
                registered_by_type: userInfo.type,
                ...(userInfo.type === 'educator'
                    ? { registered_by_educator_id: userInfo.id }
                    : { registered_by_admin_id: userInfo.id }
                )
            }));

            await supabase
                .from('competition_clubs')
                .insert(clubRecords);
        }

        return { ...data, participatingClubs: competitionData.participatingClubs || [], results: [] };
    } catch (error) {
        console.error('Error creating competition:', error);
        throw error;
    }
}

// Register student for competition
export async function registerForCompetition(
    compId: string,
    studentEmail: string,
    registrationData: {
        studentName: string;
        studentId: string;
        grade: string;
        teamMembers?: string;
        notes?: string;
    }
): Promise<CompetitionRegistration> {
    try {
        const userInfo = await getCurrentUserInfo();
        if (!userInfo) {
            throw new Error('User authentication failed');
        }

        const registration = {
            comp_id: compId,
            student_email: studentEmail,
            team_members: registrationData.teamMembers 
                ? JSON.parse(JSON.stringify({ members: registrationData.teamMembers.split(',').map(m => m.trim()) }))
                : null,
            notes: registrationData.notes,
            status: 'registered',
            registered_by_type: userInfo.type,
            ...(userInfo.type === 'educator'
                ? { registered_by_educator_id: userInfo.id }
                : { registered_by_admin_id: userInfo.id }
            )
        };

        const { data, error } = await supabase
            .from('competition_registrations')
            .insert([registration])
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error registering for competition:', error);
        throw error;
    }
}

// Get competition registrations
export async function getCompetitionRegistrations(compId: string): Promise<CompetitionRegistration[]> {
    try {
        const { data, error } = await supabase
            .from('competition_registrations')
            .select('*')
            .eq('comp_id', compId)
            .order('registration_date', { ascending: false });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching registrations:', error);
        throw error;
    }
}

// Add competition result
export async function addCompetitionResult(
    compId: string,
    studentEmail: string,
    resultData: {
        rank?: number;
        score?: number;
        award?: string;
        category?: string;
        performance_notes?: string;
    }
): Promise<CompetitionResult> {
    try {
        const userInfo = await getCurrentUserInfo();
        if (!userInfo) {
            throw new Error('User authentication failed');
        }

        const result = {
            comp_id: compId,
            student_email: studentEmail,
            rank: resultData.rank,
            score: resultData.score,
            award: resultData.award,
            category: resultData.category,
            performance_notes: resultData.performance_notes,
            certificate_issued: false,
            recorded_by_type: userInfo.type,
            ...(userInfo.type === 'educator'
                ? { recorded_by_educator_id: userInfo.id }
                : { recorded_by_admin_id: userInfo.id }
            )
        };

        const { data, error } = await supabase
            .from('competition_results')
            .insert([result])
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error adding competition result:', error);
        throw error;
    }
}

// Get competition results
export async function getCompetitionResults(compId: string): Promise<CompetitionResult[]> {
    try {
        const { data, error } = await supabase
            .from('competition_results')
            .select('*')
            .eq('comp_id', compId)
            .order('rank', { ascending: true });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching competition results:', error);
        throw error;
    }
}

// Update competition registration
export async function updateCompetitionRegistration(
    registrationId: string,
    updateData: {
        teamMembers?: string;
        notes?: string;
    }
): Promise<void> {
    try {
        const userInfo = await getCurrentUserInfo();
        if (!userInfo) {
            throw new Error('User authentication failed');
        }

        const updates: any = {
            notes: updateData.notes
        };

        if (updateData.teamMembers) {
            updates.team_members = JSON.parse(JSON.stringify({ 
                members: updateData.teamMembers.split(',').map(m => m.trim()).filter(m => m) 
            }));
        }

        const { error } = await supabase
            .from('competition_registrations')
            .update(updates)
            .eq('registration_id', registrationId);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating competition registration:', error);
        throw error;
    }
}

// Delete competition registration
export async function deleteCompetitionRegistration(registrationId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('competition_registrations')
            .delete()
            .eq('registration_id', registrationId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting competition registration:', error);
        throw error;
    }
}
