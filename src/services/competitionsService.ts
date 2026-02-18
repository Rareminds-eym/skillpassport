import { supabase } from '../lib/supabaseClient';

export interface Competition {
    comp_id: string;
    school_id?: string;
    college_id?: string;
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

// Get current user's school_id or college_id
async function getCurrentUserSchoolId(): Promise<string | null> {
    try {
        // First check localStorage for school admin
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                if (userData.role === 'school_admin' && userData.schoolId) {
                    console.log('✅ [CompetitionsService] Found school ID from localStorage:', userData.schoolId);
                    return userData.schoolId;
                }
            } catch (e) {
                console.error('Error parsing stored user:', e);
            }
        }

        const userEmail = localStorage.getItem('userEmail');
        console.log('🔍 [CompetitionsService] Getting institution ID for user:', userEmail);

        // Get current Supabase user
        const { data: { user } } = await supabase.auth.getUser();

        // Try school_educators first
        if (user) {
            const { data: educatorData } = await supabase
                .from('school_educators')
                .select('school_id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (educatorData?.school_id) {
                console.log('✅ [CompetitionsService] Found school ID from school_educators:', educatorData.school_id);
                return educatorData.school_id;
            }
        }

        // Try by email if userEmail exists
        if (userEmail) {
            const { data: educatorByEmail } = await supabase
                .from('school_educators')
                .select('school_id')
                .eq('email', userEmail)
                .maybeSingle();

            if (educatorByEmail?.school_id) {
                console.log('✅ [CompetitionsService] Found school ID from school_educators by email:', educatorByEmail.school_id);
                return educatorByEmail.school_id;
            }
        }

        // Try college_lecturers table
        if (user) {
            const { data: lecturerData, error: lecturerError } = await supabase
                .from('college_lecturers')
                .select('collegeId')
                .eq('user_id', user.id)
                .maybeSingle();

            if (lecturerError) {
                console.error('❌ [CompetitionsService] Lecturer query error:', lecturerError);
            }

            if (lecturerData?.collegeId) {
                console.log('✅ [CompetitionsService] Found college ID from college_lecturers:', lecturerData.collegeId);
                return lecturerData.collegeId;
            }
        }

        // Try organizations table (for admins)
        if (user || userEmail) {
            const { data: orgData } = await supabase
                .from('organizations')
                .select('id')
                .eq('organization_type', 'school')
                .or(`admin_id.eq.${user?.id || ''},email.eq.${userEmail || user?.email || ''}`)
                .maybeSingle();

            if (orgData?.id) {
                console.log('✅ [CompetitionsService] Found school ID from organizations table:', orgData.id);
                return orgData.id;
            }
        }

        console.log('❌ [CompetitionsService] No institution ID found for user');
        return null;
    } catch (error) {
        console.error('❌ [CompetitionsService] Error getting institution_id:', error);
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

        // Check if admin in organizations table
        const { data: orgData } = await supabase
            .from('organizations')
            .select('id')
            .eq('organization_type', 'school')
            .eq('email', userEmail)
            .maybeSingle();

        if (orgData?.id) {
            return { type: 'admin', id: orgData.id };
        }

        return null;
    } catch (error) {
        console.error('Error getting user info:', error);
        return null;
    }
}

// Helper function to check if current user is a college lecturer
async function isCollegeLecturer(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data: lecturerData } = await supabase
            .from('college_lecturers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
        
        return !!lecturerData;
    } catch (error) {
        console.error('Error checking college lecturer status:', error);
        return false;
    }
}

// Fetch all competitions for current school or college
export async function fetchCompetitions(): Promise<Competition[]> {
    try {
        const institutionId = await getCurrentUserSchoolId();
        if (!institutionId) {
            throw new Error('Institution ID not found');
        }

        console.log('🔍 [CompetitionsService] Fetching competitions for institution:', institutionId);

        const isCollege = await isCollegeLecturer();

        let query = supabase
            .from('competitions')
            .select('*')
            .order('competition_date', { ascending: true });

        if (isCollege) {
            console.log('� [CompetitionsService] Fetching college competitions');
            query = query.eq('college_id', institutionId);
        } else {
            console.log('🏫 [CompetitionsService] Fetching school competitions');
            query = query.eq('school_id', institutionId);
        }

        const { data, error } = await query;

        if (error) throw error;

        console.log('📋 [CompetitionsService] Found', data?.length || 0, 'competitions');

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
    status?: string;
}): Promise<Competition> {
    try {
        const institutionId = await getCurrentUserSchoolId();
        const userInfo = await getCurrentUserInfo();

        if (!institutionId || !userInfo) {
            throw new Error('User authentication failed');
        }

        const isCollege = await isCollegeLecturer();

        const newCompetition: any = {
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

        // Set either school_id or college_id
        if (isCollege) {
            newCompetition.college_id = institutionId;
        } else {
            newCompetition.school_id = institutionId;
        }

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
        console.log('🔍 [CompetitionsService] Fetching registrations for competition:', compId);
        const { data, error } = await supabase
            .from('competition_registrations')
            .select('*')
            .eq('comp_id', compId)
            .order('registration_date', { ascending: false });

        if (error) {
            console.error('❌ [CompetitionsService] Error fetching registrations:', error);
            throw error;
        }

        console.log('📋 [CompetitionsService] Found registrations:', data?.length || 0, data);
        return data || [];
    } catch (error) {
        console.error('❌ [CompetitionsService] Error fetching registrations:', error);
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

// Update competition
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
        const userInfo = await getCurrentUserInfo();
        if (!userInfo) {
            throw new Error('User authentication failed');
        }

        // Update competition basic info
        const updates: any = {};
        if (updateData.name) updates.name = updateData.name;
        if (updateData.level) updates.level = updateData.level;
        if (updateData.date) updates.competition_date = updateData.date;
        if (updateData.description !== undefined) updates.description = updateData.description;
        if (updateData.category !== undefined) updates.category = updateData.category;
        if (updateData.status !== undefined) updates.status = updateData.status;

        const { error: updateError } = await supabase
            .from('competitions')
            .update(updates)
            .eq('comp_id', compId);

        if (updateError) throw updateError;

        // Update participating clubs if provided
        if (updateData.participatingClubs !== undefined) {
            // Get current participating clubs
            const { data: currentClubs } = await supabase
                .from('competition_clubs')
                .select('club_id')
                .eq('comp_id', compId);

            const currentClubIds = new Set(currentClubs?.map(c => c.club_id) || []);
            const newClubIds = new Set(updateData.participatingClubs);

            // Find clubs to remove and clubs to add
            const clubsToRemove = [...currentClubIds].filter(id => !newClubIds.has(id));
            const clubsToAdd = [...newClubIds].filter(id => !currentClubIds.has(id));

            // Remove clubs that are no longer participating
            if (clubsToRemove.length > 0) {
                await supabase
                    .from('competition_clubs')
                    .delete()
                    .eq('comp_id', compId)
                    .in('club_id', clubsToRemove);
            }

            // Add new participating clubs
            if (clubsToAdd.length > 0) {
                const clubRecords = clubsToAdd.map(clubId => ({
                    comp_id: compId,
                    club_id: clubId,
                    registered_by_type: userInfo.type,
                    ...(userInfo.type === 'educator'
                        ? { registered_by_educator_id: userInfo.id }
                        : { registered_by_admin_id: userInfo.id }
                    )
                }));

                const { error: insertError } = await supabase
                    .from('competition_clubs')
                    .insert(clubRecords);

                if (insertError) throw insertError;
            }
        }
    } catch (error) {
        console.error('Error updating competition:', error);
        throw error;
    }
}

// Delete competition
export async function deleteCompetition(compId: string): Promise<void> {
    try {
        // Delete associated records first (cascade should handle this, but being explicit)
        await supabase.from('competition_clubs').delete().eq('comp_id', compId);
        await supabase.from('competition_registrations').delete().eq('comp_id', compId);
        await supabase.from('competition_results').delete().eq('comp_id', compId);

        // Delete the competition
        const { error } = await supabase
            .from('competitions')
            .delete()
            .eq('comp_id', compId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting competition:', error);
        throw error;
    }
}
