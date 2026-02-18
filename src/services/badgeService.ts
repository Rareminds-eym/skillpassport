import { supabase } from '../lib/supabaseClient';

export interface BadgeData {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    school_id?: string;
    college_id?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface StudentBadgeData {
    id: string;
    badge_id: string;
    student_id: string;
    school_id?: string;
    college_id?: string;
    awarded_by: string;
    awarded_date: string;
    notes?: string;
    badge?: BadgeData;
    student?: {
        id: string;
        name: string;
        email: string;
    };
}

// Get current user's school_id or college_id
async function getCurrentUserInstitutionId(): Promise<{ id: string; type: 'school' | 'college' } | null> {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                if (userData.role === 'school_admin' && userData.schoolId) {
                    return { id: userData.schoolId, type: 'school' };
                }
            } catch (e) {
                console.error('Error parsing stored user:', e);
            }
        }

        const userEmail = localStorage.getItem('userEmail');
        const { data: { user } } = await supabase.auth.getUser();

        // Try school_educators first
        if (user) {
            const { data: educatorData } = await supabase
                .from('school_educators')
                .select('school_id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (educatorData?.school_id) {
                return { id: educatorData.school_id, type: 'school' };
            }
        }

        if (userEmail) {
            const { data: educatorByEmail } = await supabase
                .from('school_educators')
                .select('school_id')
                .eq('email', userEmail)
                .maybeSingle();

            if (educatorByEmail?.school_id) {
                return { id: educatorByEmail.school_id, type: 'school' };
            }
        }

        // Try college_lecturers
        if (user) {
            const { data: lecturerData } = await supabase
                .from('college_lecturers')
                .select('collegeId')
                .eq('user_id', user.id)
                .maybeSingle();

            if (lecturerData?.collegeId) {
                return { id: lecturerData.collegeId, type: 'college' };
            }
        }

        return null;
    } catch (error) {
        console.error('Error getting institution ID:', error);
        return null;
    }
}

// Fetch all badges for current institution
export async function fetchBadges(): Promise<BadgeData[]> {
    try {
        const institution = await getCurrentUserInstitutionId();
        if (!institution) {
            throw new Error('Institution ID not found');
        }

        let query = supabase
            .from('badges')
            .select('*')
            .order('created_at', { ascending: false });

        if (institution.type === 'school') {
            query = query.eq('school_id', institution.id);
        } else {
            query = query.eq('college_id', institution.id);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching badges:', error);
        throw error;
    }
}

// Fetch all awarded badges (student_badges) with student and badge details
export async function fetchAwardedBadges(): Promise<StudentBadgeData[]> {
    try {
        const institution = await getCurrentUserInstitutionId();
        if (!institution) {
            throw new Error('Institution ID not found');
        }

        let query = supabase
            .from('student_badges')
            .select(`
                *,
                badge:badges(*),
                student:students(id, name, email)
            `)
            .order('awarded_date', { ascending: false });

        if (institution.type === 'school') {
            query = query.eq('school_id', institution.id);
        } else {
            query = query.eq('college_id', institution.id);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching awarded badges:', error);
        throw error;
    }
}

// Create a new badge
export async function createBadge(badgeData: {
    name: string;
    description: string;
    icon: string;
    color: string;
}): Promise<BadgeData> {
    try {
        const institution = await getCurrentUserInstitutionId();
        const { data: { user } } = await supabase.auth.getUser();

        if (!institution || !user) {
            throw new Error('User authentication failed');
        }

        const newBadge: any = {
            name: badgeData.name,
            description: badgeData.description,
            icon: badgeData.icon,
            color: badgeData.color,
            created_by: user.id
        };

        if (institution.type === 'school') {
            newBadge.school_id = institution.id;
        } else {
            newBadge.college_id = institution.id;
        }

        const { data, error } = await supabase
            .from('badges')
            .insert([newBadge])
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error creating badge:', error);
        throw error;
    }
}

// Award a badge to a student
export async function awardBadge(
    badgeId: string,
    studentId: string,
    notes?: string
): Promise<StudentBadgeData> {
    try {
        const institution = await getCurrentUserInstitutionId();
        const { data: { user } } = await supabase.auth.getUser();

        if (!institution || !user) {
            throw new Error('User authentication failed');
        }

        const awardData: any = {
            badge_id: badgeId,
            student_id: studentId,
            awarded_by: user.id,
            notes: notes || null
        };

        if (institution.type === 'school') {
            awardData.school_id = institution.id;
        } else {
            awardData.college_id = institution.id;
        }

        const { data, error } = await supabase
            .from('student_badges')
            .insert([awardData])
            .select(`
                *,
                badge:badges(*),
                student:students(id, name, email)
            `)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error awarding badge:', error);
        throw error;
    }
}

// Delete an awarded badge
export async function deleteAwardedBadge(studentBadgeId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('student_badges')
            .delete()
            .eq('id', studentBadgeId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting awarded badge:', error);
        throw error;
    }
}

// Delete a badge (will cascade delete all awarded instances)
export async function deleteBadge(badgeId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('badges')
            .delete()
            .eq('id', badgeId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting badge:', error);
        throw error;
    }
}

// Fetch students for awarding badges
export async function fetchStudents(): Promise<Array<{ id: string; name: string; email: string }>> {
    try {
        const institution = await getCurrentUserInstitutionId();
        if (!institution) {
            throw new Error('Institution ID not found');
        }

        let query = supabase
            .from('students')
            .select('id, name, email')
            .not('name', 'is', null)
            .order('name', { ascending: true });

        if (institution.type === 'school') {
            query = query.eq('school_id', institution.id);
        } else {
            // For colleges, check both university_college_id and college_id
            query = query.or(`university_college_id.eq.${institution.id},college_id.eq.${institution.id}`);
        }

        const { data, error } = await query;

        if (error) throw error;

        console.log('✅ Fetched students:', data?.length || 0);
        return data || [];
    } catch (error) {
        console.error('Error fetching students:', error);
        throw error;
    }
}


// Legacy functions for backward compatibility
// These are stubs - the actual badge system now uses database-stored badges
export function generateBadges(studentData: any): any[] {
    // Return empty array - badges are now managed through the database
    return [];
}

export function getBadgeProgress(studentData: any): any {
    // Return empty object - badge progress is now tracked in the database
    return {};
}
