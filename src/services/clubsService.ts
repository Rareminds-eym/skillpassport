import { supabase } from '../lib/supabaseClient';

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
    student_email: string;
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
    student_email: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
}

// Get current user's school_id using the same logic as students
async function getCurrentUserSchoolId(): Promise<string | null> {
    try {
        console.log('🚀 [Clubs Service] Fetching school_id with school filtering...');
        
        let schoolId: string | null = null;

        // First, check if user is logged in via AuthContext (for school admins)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                console.log('📦 Found user in localStorage:', userData.email, 'role:', userData.role);
                if (userData.role === 'school_admin' && userData.schoolId) {
                    schoolId = userData.schoolId;
                    console.log('✅ School admin detected, using schoolId from localStorage:', schoolId);
                }
            } catch (e) {
                console.error('Error parsing stored user:', e);
            }
        }

        // If not found in localStorage, try Supabase Auth (for educators/teachers)
        if (!schoolId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                console.log('🔍 Checking Supabase auth user:', user.email);
                
                // Check school_educators table
                const { data: educator } = await supabase
                    .from('school_educators')
                    .select('school_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (educator?.school_id) {
                    schoolId = educator.school_id;
                    console.log('✅ Found school_id in school_educators:', schoolId);
                } else {
                    // Check organizations table by email
                    const { data: org } = await supabase
                        .from('organizations')
                        .select('id')
                        .eq('organization_type', 'school')
                        .eq('email', user.email)
                        .maybeSingle();
                    
                    schoolId = org?.id || null;
                    if (schoolId) {
                        console.log('✅ Found school_id in organizations table:', schoolId);
                    }
                }
            }
        }

        return schoolId;
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

// Fetch all clubs for current school
export async function fetchClubs(): Promise<Club[]> {
    try {
        console.log('🔍 [clubsService.fetchClubs] Starting fetch...');
        const schoolId = await getCurrentUserSchoolId();
        console.log('🏫 [clubsService.fetchClubs] Using school_id:', schoolId);
        
        if (!schoolId) {
            console.log('❌ [clubsService.fetchClubs] School ID not found');
            throw new Error('School ID not found');
        }

        console.log('📡 [clubsService.fetchClubs] Querying clubs table...');
        const { data, error } = await supabase
            .from('clubs')
            .select('*')
            .eq('school_id', schoolId)
            .eq('is_active', true)
            .order('name');

        if (error) {
            console.error('❌ [clubsService.fetchClubs] Database error:', error);
            throw error;
        }

        console.log('📦 [clubsService.fetchClubs] Found', data?.length || 0, 'clubs');

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
                    .select('student_email')
                    .eq('club_id', club.club_id)
                    .eq('status', 'active');

                console.log(`👥 [clubsService.fetchClubs] Club "${club.name}" has ${count || 0} members`);

                return {
                    ...club,
                    member_count: count || 0,
                    members: memberships?.map(m => m.student_email) || []
                };
            })
        );

        console.log('✅ [clubsService.fetchClubs] Successfully fetched clubs with members');
        return clubsWithMembers;
    } catch (error) {
        console.error('❌ [clubsService.fetchClubs] Error fetching clubs:', error);
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
        console.log('🎯 [createClub] Starting club creation...');
        console.log('📝 [createClub] Input data:', clubData);
        
        // Use provided school_id or fetch it
        const schoolId = clubData.school_id || await getCurrentUserSchoolId();
        console.log('🏫 [createClub] School ID:', schoolId);
        
        const userInfo = await getCurrentUserInfo();
        console.log('👤 [createClub] User info:', userInfo);

        if (!schoolId) {
            console.error('❌ [createClub] No school ID found');
            throw new Error('School ID not found. Please ensure you are logged in as a school admin or educator.');
        }

        if (!userInfo) {
            console.error('❌ [createClub] User authentication failed');
            throw new Error('User authentication failed. Please ensure you are logged in.');
        }

        console.log('🏫 [createClub] Creating club with school_id:', schoolId);
        console.log('📝 [createClub] Club data:', clubData);

        // Try to find mentor educator if email is provided
        let mentorType = clubData.mentor_type || null;
        let mentorEducatorId = clubData.mentor_educator_id || null;
        let mentorSchoolId = clubData.mentor_school_id || null;

        if (clubData.mentor_email && !mentorEducatorId) {
            console.log('🔍 Looking up educator with email:', clubData.mentor_email);
            const { data: educatorData } = await supabase
                .from('school_educators')
                .select('id')
                .eq('email', clubData.mentor_email)
                .eq('school_id', schoolId)
                .maybeSingle();

            if (educatorData?.id) {
                mentorType = 'educator';
                mentorEducatorId = educatorData.id;
                console.log('✅ Found educator, linking as mentor:', educatorData.id);
            } else {
                console.log('ℹ️ No educator found with that email, storing name only');
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

        // Only add mentor_name if it's provided and we're sure the column exists
        // For now, we'll skip this field to avoid database errors
        // The mentor_name field doesn't exist in the current database schema

        console.log('💾 [createClub] Inserting club into database:', newClub);

        const { data, error } = await supabase
            .from('clubs')
            .insert([newClub])
            .select()
            .single();

        if (error) {
            console.error('❌ [createClub] Database error:', error);
            console.error('❌ [createClub] Error code:', error.code);
            console.error('❌ [createClub] Error message:', error.message);
            console.error('❌ [createClub] Error details:', error.details);
            console.error('❌ [createClub] Error hint:', error.hint);
            
            // Provide more specific error messages
            if (error.code === '23505') {
                throw new Error(`A club named "${clubData.name}" already exists in your school.`);
            } else if (error.code === '23503') {
                throw new Error('Invalid reference: Please check school ID or mentor information.');
            } else {
                throw new Error(`Failed to create club: ${error.message || 'Unknown database error'}`);
            }
        }

        console.log('✅ Club created successfully:', data);

        return { ...data, member_count: 0, members: [] };
    } catch (error) {
        console.error('❌ Error creating club:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to create club. Please check console for details.');
    }
}

// Enroll student in club
export async function enrollStudent(clubId: string, studentEmail: string): Promise<ClubMembership> {
    try {
        const userInfo = await getCurrentUserInfo();
        if (!userInfo) {
            throw new Error('User authentication failed');
        }

        console.log('🔍 [enrollStudent] Checking for existing membership...');
        
        // First, check if there's already a membership record (active or withdrawn)
        const { data: existingMembership, error: checkError } = await supabase
            .from('club_memberships')
            .select('*')
            .eq('club_id', clubId)
            .eq('student_email', studentEmail)
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 means no rows found, which is fine
            console.error('Error checking existing membership:', checkError);
            throw checkError;
        }

        if (existingMembership) {
            console.log('📝 [enrollStudent] Found existing membership:', existingMembership);
            
            if (existingMembership.status === 'active') {
                throw new Error('Student is already enrolled in this club');
            }
            
            // If status is 'withdrawn', reactivate the membership
            if (existingMembership.status === 'withdrawn') {
                console.log('🔄 [enrollStudent] Reactivating withdrawn membership...');
                
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
                
                console.log('✅ [enrollStudent] Membership reactivated successfully');
                return data;
            }
        }

        // No existing membership found, create a new one
        console.log('➕ [enrollStudent] Creating new membership...');
        
        const membership = {
            club_id: clubId,
            student_email: studentEmail,
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

        console.log('✅ [enrollStudent] New membership created successfully');
        return data;
    } catch (error) {
        console.error('Error enrolling student:', error);
        throw error;
    }
}

// Remove student from club
export async function removeStudent(clubId: string, studentEmail: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('club_memberships')
            .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() })
            .eq('club_id', clubId)
            .eq('student_email', studentEmail);

        if (error) throw error;
    } catch (error) {
        console.error('Error removing student:', error);
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
        console.error('Error fetching club members:', error);
        throw error;
    }
}

// Mark attendance for a club session
export async function markAttendance(
    clubId: string,
    sessionDate: string,
    sessionTopic: string,
    attendanceRecords: { student_email: string; status: 'present' | 'absent' | 'late' | 'excused' }[]
): Promise<void> {
    try {
        const userInfo = await getCurrentUserInfo();
        if (!userInfo) {
            throw new Error('User authentication failed');
        }

        console.log('🎯 [markAttendance] Starting attendance marking for club:', clubId, 'date:', sessionDate);

        // Check if attendance session already exists for this club and date
        const { data: existingSession, error: checkError } = await supabase
            .from('club_attendance')
            .select('attendance_id')
            .eq('club_id', clubId)
            .eq('session_date', sessionDate)
            .maybeSingle();

        if (checkError) {
            console.error('❌ [markAttendance] Error checking existing session:', checkError);
            throw checkError;
        }

        let sessionData;

        if (existingSession) {
            console.log('📝 [markAttendance] Found existing session, will update:', existingSession.attendance_id);
            
            // Update the session topic
            const { error: updateError } = await supabase
                .from('club_attendance')
                .update({
                    session_topic: sessionTopic
                })
                .eq('attendance_id', existingSession.attendance_id);

            if (updateError) {
                console.error('❌ [markAttendance] Error updating session topic:', updateError);
                throw updateError;
            }

            console.log('✅ [markAttendance] Updated session topic');
            sessionData = existingSession;
        } else {
            console.log('➕ [markAttendance] Creating new attendance session');
            
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
                console.error('❌ [markAttendance] Error creating session:', sessionError);
                throw sessionError;
            }

            sessionData = newSession;
            console.log('✅ [markAttendance] Created new session:', sessionData.attendance_id);
        }

        // Create attendance records - use regular insert with proper error handling
        console.log('📊 [markAttendance] Inserting', attendanceRecords.length, 'attendance records');

        const records = attendanceRecords.map(record => ({
            attendance_id: sessionData.attendance_id,
            student_email: record.student_email,
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
            console.error('❌ [markAttendance] Error creating records:', recordsError);
            
            // If it's a duplicate key error, try to delete existing records first
            if (recordsError.code === '23505') {
                console.log('🔄 [markAttendance] Duplicate records detected, clearing and retrying...');
                
                // Delete existing records for this session
                const { error: deleteError } = await supabase
                    .from('club_attendance_records')
                    .delete()
                    .eq('attendance_id', sessionData.attendance_id);

                if (deleteError) {
                    console.error('❌ [markAttendance] Error deleting existing records:', deleteError);
                    throw deleteError;
                }

                // Retry the insert
                const { error: retryError } = await supabase
                    .from('club_attendance_records')
                    .insert(records);

                if (retryError) {
                    console.error('❌ [markAttendance] Error on retry insert:', retryError);
                    throw retryError;
                }

                console.log('✅ [markAttendance] Successfully inserted records on retry');
            } else {
                throw recordsError;
            }
        } else {
            console.log('✅ [markAttendance] Successfully marked attendance for', attendanceRecords.length, 'students');
        }
    } catch (error) {
        console.error('❌ [markAttendance] Error marking attendance:', error);
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
        console.error('Error fetching club details:', error);
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
            Object.entries(clubData).filter(([key, value]) => 
                value !== undefined && 
                value !== null && 
                value !== ""
            )
        );

        console.log('🔄 [updateClub] Updating club with data:', cleanData);

        const { error } = await supabase
            .from('clubs')
            .update({
                ...cleanData,
                updated_at: new Date().toISOString()
            })
            .eq('club_id', clubId);

        if (error) {
            console.error('❌ [updateClub] Database error details:', error);
            throw error;
        }

        console.log('✅ [updateClub] Club updated successfully');
    } catch (error) {
        console.error('❌ [updateClub] Error updating club:', error);
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
        console.error('Error deleting club:', error);
        throw error;
    }
}
