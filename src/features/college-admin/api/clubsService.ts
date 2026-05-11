import { getCurrentSession, getCurrentUser } from '@/shared/api/authUtils';
import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('clubs-service');

export interface Club {
    club_id: string;
    school_id: string;
    name: string;
    category: 'arts' | 'sports' | 'robotics' | 'science' | 'literature';
    description: string;
    capacity: number;
    meeting_day?: string;
    meeting_time?: string;
    location?: string;
    mentor_type?: 'educator' | 'school';
    mentor_educator_id?: string;
    mentor_school_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    member_count?: number;
    members?: string[];
}

export interface ClubMembership {
    membership_id: string;
    club_id: string;
    learner_email: string;
    enrolled_at: string;
    status: 'active' | 'withdrawn' | 'suspended';
    total_sessions_attended: number;
    total_sessions_held: number;
    attendance_percentage: number;
    performance_score: number;
}

export interface ClubAttendance {
    attendance_id: string;
    club_id: string;
    session_date: string;
    session_topic: string;
    session_description?: string;
    duration_minutes?: number;
}

export interface ClubAttendanceRecord {
    record_id: string;
    attendance_id: string;
    learner_email: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
}

// Get current user's school_id using the same logic as learners
async function getCurrentUserSchoolId(): Promise<string | null> {
    try {
        let schoolId: string | null = null;

        // First, check if user is logged in via AuthContext (for school admins)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                if (userData.role === 'school_admin' && userData.schoolId) {
                    schoolId = userData.schoolId;
                }
            } catch (e) {
                logger.error('Failed to parse stored user', e instanceof Error ? e : new Error(String(e)));
            }
        }

        // If not found in localStorage, try Supabase Auth (for educators/teachers)
        if (!schoolId) {
            const { data: { user } } = await getCurrentUser();
            if (user) {
                // Check school_educators table
                const { data: educator } = await supabase
                    .from('school_educators')
                    .select('school_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (educator?.school_id) {
                    schoolId = educator.school_id;
                } else {
                    // Check organizations table by email
                    const { data: org } = await supabase
                        .from('organizations')
                        .select('id')
                        .eq('organization_type', 'school')
                        .eq('email', user.email)
                        .maybeSingle();

                    schoolId = org?.id || null;
                }
            }
        }

        return schoolId;
    } catch (error) {
        logger.error('Failed to get school ID', error instanceof Error ? error : new Error(String(error)));
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
        logger.error('Failed to get user info', error instanceof Error ? error : new Error(String(error)), {
            userEmail: localStorage.getItem('userEmail')
        });
        return null;
    }
}

// Fetch all clubs for current school
export async function fetchClubs(): Promise<Club[]> {
    try {
        const schoolId = await getCurrentUserSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found');
        }

        const { data, error } = await supabase
            .from('clubs')
            .select('*')
            .eq('school_id', schoolId)
            .eq('is_active', true)
            .order('name');

        if (error) {
            logger.error('Failed to fetch clubs', error instanceof Error ? error : new Error(String(error)), {
                schoolId
            });
            throw error;
        }

        // Fetch member counts for each club
        const clubsWithMembers = await Promise.all(
            (data || []).map(async (club) => {
                const { count } = await supabase
                    .from('club_memberships')
                    .select('*', { count: 'exact', head: true })
                    .eq('club_id', club.club_id)
                    .eq('status', 'active');

                // Fetch member emails
                const { data: memberships } = await supabase
                    .from('club_memberships')
                    .select('learner_email')
                    .eq('club_id', club.club_id)
                    .eq('status', 'active');

                return {
                    ...club,
                    member_count: count || 0,
                    members: memberships?.map(m => m.learner_email) || []
                };
            })
        );

        return clubsWithMembers;
    } catch (error) {
        logger.error('Failed to fetch clubs', error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}

// Create a new club
export async function createClub(clubData: {
    name: string;
    category: string;
    description: string;
    capacity: number;
    meeting_day?: string;
    meeting_time?: string;
    location?: string;
    mentor_email?: string;
    mentor_type?: 'educator' | 'school';
    mentor_educator_id?: string;
    mentor_school_id?: string;
    school_id?: string;
}): Promise<Club> {
    try {
        // Use provided school_id or fetch it
        const schoolId = clubData.school_id || await getCurrentUserSchoolId();

        const userInfo = await getCurrentUserInfo();

        if (!schoolId) {
            throw new Error('School ID not found. Please ensure you are logged in as a school admin or educator.');
        }

        if (!userInfo) {
            throw new Error('User authentication failed. Please ensure you are logged in.');
        }

        // Try to find mentor educator if email is provided
        let mentorType = clubData.mentor_type || null;
        let mentorEducatorId = clubData.mentor_educator_id || null;
        let mentorSchoolId = clubData.mentor_school_id || null;

        if (clubData.mentor_email && !mentorEducatorId) {
            const { data: educatorData } = await supabase
                .from('school_educators')
                .select('id')
                .eq('email', clubData.mentor_email)
                .eq('school_id', schoolId)
                .maybeSingle();

            if (educatorData?.id) {
                mentorType = 'educator';
                mentorEducatorId = educatorData.id;
            }
        }

        // Build the club object - exclude mentor_name if it might not exist in schema
        const newClub: any = {
            school_id: schoolId,
            name: clubData.name,
            category: clubData.category,
            description: clubData.description,
            capacity: clubData.capacity,
            meeting_day: clubData.meeting_day || null,
            meeting_time: clubData.meeting_time || null,
            location: clubData.location || null,
            mentor_type: mentorType,
            mentor_educator_id: mentorEducatorId,
            mentor_school_id: mentorSchoolId,
            is_active: true,
            ...(userInfo ? {
                created_by_type: userInfo.type,
                ...(userInfo.type === 'educator'
                    ? { created_by_educator_id: userInfo.id }
                    : { created_by_admin_id: userInfo.id }
                )
            } : {})
        };

        const { data, error } = await supabase
            .from('clubs')
            .insert([newClub])
            .select()
            .single();

        if (error) {
            logger.error('Failed to create club', error instanceof Error ? error : new Error(String(error)), {
                clubName: clubData.name,
                schoolId,
                errorCode: (error as any).code
            });

            // Provide more specific error messages
            if ((error as any).code === '23505') {
                throw new Error(`A club named "${clubData.name}" already exists in your school.`);
            } else if ((error as any).code === '23503') {
                throw new Error('Invalid reference: Please check school ID or mentor information.');
            } else {
                throw new Error(`Failed to create club: ${(error as any).message || 'Unknown database error'}`);
            }
        }

        return { ...data, member_count: 0, members: [] };
    } catch (error) {
        logger.error('Failed to create club', error instanceof Error ? error : new Error(String(error)), {
            clubName: clubData.name
        });
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to create club. Please check console for details.');
    }
}

// Enroll learner in club
export async function enrollLearner(clubId: string, learnerEmail: string): Promise<ClubMembership> {
    try {
        const userInfo = await getCurrentUserInfo();
        if (!userInfo) {
            throw new Error('User authentication failed');
        }

        // First, check if there's already a membership record (active or withdrawn)
        const { data: existingMembership, error: checkError } = await supabase
            .from('club_memberships')
            .select('*')
            .eq('club_id', clubId)
            .eq('learner_email', learnerEmail)
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 means no rows found, which is fine
            logger.error('Failed to check existing membership', checkError instanceof Error ? checkError : new Error(String(checkError)), {
                clubId,
                learnerEmail
            });
            throw checkError;
        }

        if (existingMembership) {
            if (existingMembership.status === 'active') {
                throw new Error('Learner is already enrolled in this club');
            }

            // If status is 'withdrawn', reactivate the membership
            if (existingMembership.status === 'withdrawn') {
                const { data, error } = await supabase
                    .from('club_memberships')
                    .update({
                        status: 'active',
                        enrolled_by_type: userInfo.type,
                        enrolled_at: new Date().toISOString(),
                        withdrawn_at: null,
                        ...(userInfo.type === 'educator'
                            ? { enrolled_by_educator_id: userInfo.id, enrolled_by_admin_id: null }
                            : { enrolled_by_admin_id: userInfo.id, enrolled_by_educator_id: null }
                        )
                    })
                    .eq('membership_id', existingMembership.membership_id)
                    .select()
                    .single();

                if (error) throw error;

                return data;
            }
        }

        // No existing membership found, create a new one
        const membership = {
            club_id: clubId,
            learner_email: learnerEmail,
            status: 'active',
            enrolled_by_type: userInfo.type,
            ...(userInfo.type === 'educator'
                ? { enrolled_by_educator_id: userInfo.id }
                : { enrolled_by_admin_id: userInfo.id }
            )
        };

        const { data, error } = await supabase
            .from('club_memberships')
            .insert([membership])
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        logger.error('Failed to enroll learner', error instanceof Error ? error : new Error(String(error)), {
            clubId,
            learnerEmail
        });
        throw error;
    }
}

// Remove learner from club
export async function removeLearner(clubId: string, learnerEmail: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('club_memberships')
            .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() })
            .eq('club_id', clubId)
            .eq('learner_email', learnerEmail);

        if (error) throw error;
    } catch (error) {
        logger.error('Failed to remove learner', error instanceof Error ? error : new Error(String(error)), {
            clubId,
            learnerEmail
        });
        throw error;
    }
}

// Get club members
export async function getClubMembers(clubId: string): Promise<ClubMembership[]> {
    try {
        const { data, error } = await supabase
            .from('club_memberships')
            .select('*')
            .eq('club_id', clubId)
            .eq('status', 'active')
            .order('enrolled_at', { ascending: false });

        if (error) throw error;

        return data || [];
    } catch (error) {
        logger.error('Failed to fetch club members', error instanceof Error ? error : new Error(String(error)), {
            clubId
        });
        throw error;
    }
}

// Mark attendance for a club session
export async function markClubAttendance(
    clubId: string,
    sessionDate: string,
    sessionTopic: string,
    attendanceRecords: { learner_email: string; status: 'present' | 'absent' | 'late' | 'excused' }[]
): Promise<void> {
    try {
        const userInfo = await getCurrentUserInfo();
        if (!userInfo) {
            throw new Error('User authentication failed');
        }

        // Check if attendance session already exists for this club and date
        const { data: existingSession, error: checkError } = await supabase
            .from('club_attendance')
            .select('attendance_id')
            .eq('club_id', clubId)
            .eq('session_date', sessionDate)
            .maybeSingle();

        if (checkError) {
            logger.error('Failed to check existing session', checkError instanceof Error ? checkError : new Error(String(checkError)), {
                clubId,
                sessionDate
            });
            throw checkError;
        }

        let sessionData;

        if (existingSession) {
            // Update the session topic
            const { error: updateError } = await supabase
                .from('club_attendance')
                .update({
                    session_topic: sessionTopic
                })
                .eq('attendance_id', existingSession.attendance_id);

            if (updateError) {
                logger.error('Failed to update session topic', updateError instanceof Error ? updateError : new Error(String(updateError)), {
                    attendanceId: existingSession.attendance_id
                });
                throw updateError;
            }

            sessionData = existingSession;
        } else {
            // Create new attendance session
            const attendanceSession = {
                club_id: clubId,
                session_date: sessionDate,
                session_topic: sessionTopic,
                created_by_type: userInfo.type,
                ...(userInfo.type === 'educator'
                    ? { created_by_educator_id: userInfo.id }
                    : { created_by_admin_id: userInfo.id }
                )
            };

            const { data: newSession, error: sessionError } = await supabase
                .from('club_attendance')
                .insert([attendanceSession])
                .select()
                .single();

            if (sessionError) {
                logger.error('Failed to create attendance session', sessionError instanceof Error ? sessionError : new Error(String(sessionError)), {
                    clubId,
                    sessionDate
                });
                throw sessionError;
            }

            sessionData = newSession;
        }

        // Create attendance records - use regular insert with proper error handling
        const records = attendanceRecords.map(record => ({
            attendance_id: sessionData.attendance_id,
            learner_email: record.learner_email,
            status: record.status,
            marked_by_type: userInfo.type,
            ...(userInfo.type === 'educator'
                ? { marked_by_educator_id: userInfo.id }
                : { marked_by_admin_id: userInfo.id }
            )
        }));

        const { error: recordsError } = await supabase
            .from('club_attendance_records')
            .insert(records);

        if (recordsError) {
            // If it's a duplicate key error, try to delete existing records first
            if ((recordsError as any).code === '23505') {
                // Delete existing records for this session
                const { error: deleteError } = await supabase
                    .from('club_attendance_records')
                    .delete()
                    .eq('attendance_id', sessionData.attendance_id);

                if (deleteError) {
                    logger.error('Failed to delete existing attendance records', deleteError instanceof Error ? deleteError : new Error(String(deleteError)), {
                        attendanceId: sessionData.attendance_id
                    });
                    throw deleteError;
                }

                // Retry the insert
                const { error: retryError } = await supabase
                    .from('club_attendance_records')
                    .insert(records);

                if (retryError) {
                    logger.error('Failed to insert attendance records on retry', retryError instanceof Error ? retryError : new Error(String(retryError)), {
                        attendanceId: sessionData.attendance_id,
                        recordCount: records.length
                    });
                    throw retryError;
                }
            } else {
                logger.error('Failed to create attendance records', recordsError instanceof Error ? recordsError : new Error(String(recordsError)), {
                    attendanceId: sessionData.attendance_id,
                    recordCount: records.length
                });
                throw recordsError;
            }
        }
    } catch (error) {
        logger.error('Failed to mark attendance', error instanceof Error ? error : new Error(String(error)), {
            clubId,
            sessionDate
        });
        throw error;
    }
}

// Get club details with full information
export async function getClubDetails(clubId: string): Promise<any> {
    try {
        const { data, error } = await supabase
            .rpc('get_club_details', { p_club_id: clubId });

        if (error) throw error;

        return data?.[0] || null;
    } catch (error) {
        logger.error('Failed to fetch club details', error instanceof Error ? error : new Error(String(error)), {
            clubId
        });
        throw error;
    }
}

// Update club
export async function updateClub(clubId: string, clubData: {
    name?: string;
    category?: string;
    description?: string;
    capacity?: number;
    meeting_day?: string;
    meeting_time?: string;
    location?: string;
}): Promise<void> {
    try {
        // Remove any undefined, null, or empty values
        const cleanData = Object.fromEntries(
            Object.entries(clubData).filter(([_, value]) =>
                value !== undefined &&
                value !== null &&
                value !== ""
            )
        );

        const { error } = await supabase
            .from('clubs')
            .update({
                ...cleanData,
                updated_at: new Date().toISOString()
            })
            .eq('club_id', clubId);

        if (error) {
            logger.error('Failed to update club', error instanceof Error ? error : new Error(String(error)), {
                clubId
            });
            throw error;
        }
    } catch (error) {
        logger.error('Failed to update club', error instanceof Error ? error : new Error(String(error)), {
            clubId
        });
        throw error;
    }
}

// Delete club (soft delete by setting is_active to false)
export async function deleteClub(clubId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('clubs')
            .update({
                is_active: false,
                updated_at: new Date().toISOString()
            })
            .eq('club_id', clubId);

        if (error) throw error;
    } catch (error) {
        logger.error('Failed to delete club', error instanceof Error ? error : new Error(String(error)), {
            clubId
        });
        throw error;
    }
}
