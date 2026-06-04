import { apiPost } from '@/shared/api/apiClient';

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

export async function fetchClubs(): Promise<Club[]> {
    const result: any = await apiPost('/college-admin/clubs', { action: 'get-clubs' });
    return result.data || [];
}

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
    const result: any = await apiPost('/college-admin/clubs', { action: 'create-club', ...clubData });
    return result.data;
}

export async function enrollLearner(clubId: string, learnerEmail: string): Promise<ClubMembership> {
    const result: any = await apiPost('/college-admin/clubs', { action: 'enroll-learner', club_id: clubId, learner_email: learnerEmail });
    return result.data;
}

export async function removeLearner(clubId: string, learnerEmail: string): Promise<void> {
    await apiPost('/college-admin/clubs', { action: 'remove-learner', club_id: clubId, learner_email: learnerEmail });
}

export async function getClubMembers(clubId: string): Promise<ClubMembership[]> {
    const result: any = await apiPost('/college-admin/clubs', { action: 'get-club-members', club_id: clubId });
    return result.data || [];
}

export async function markClubAttendance(
    clubId: string,
    sessionDate: string,
    sessionTopic: string,
    attendanceRecords: { learner_email: string; status: 'present' | 'absent' | 'late' | 'excused' }[]
): Promise<void> {
    await apiPost('/college-admin/clubs', {
        action: 'mark-attendance',
        club_id: clubId,
        session_date: sessionDate,
        session_topic: sessionTopic,
        attendance_records: attendanceRecords,
    });
}

export async function getClubDetails(clubId: string): Promise<any> {
    const result: any = await apiPost('/college-admin/clubs', { action: 'get-club-details', club_id: clubId });
    return result.data || null;
}

export async function updateClub(clubId: string, clubData: {
    name?: string;
    category?: string;
    description?: string;
    capacity?: number;
    meeting_day?: string;
    meeting_time?: string;
    location?: string;
}): Promise<void> {
    const cleanData = Object.fromEntries(
        Object.entries(clubData).filter(([_, value]) =>
            value !== undefined && value !== null && value !== ""
        )
    );
    await apiPost('/college-admin/clubs', { action: 'update-club', club_id: clubId, ...cleanData });
}

export async function deleteClub(clubId: string): Promise<void> {
    await apiPost('/college-admin/clubs', { action: 'delete-club', club_id: clubId });
}
