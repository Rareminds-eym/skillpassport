import { useState, useCallback } from 'react';
import { SchoolClub, SchoolAchievement, SchoolCertificate, SchoolActivity } from '@/features/myclass';
import { normalizeRelation } from '@/features/myclass';
import { formatClubName } from '@/features/myclass';
import { apiPost } from '@/shared/api/apiClient';

interface UseCoCurricularsDataReturn {
  clubs: SchoolClub[];
  achievements: SchoolAchievement[];
  certificates: SchoolCertificate[];
  upcomingActivities: SchoolActivity[];
  loading: boolean;
  error: Error | null;
  fetchData: () => Promise<void>;
}

/**
 * Optimized co-curriculars data hook with lazy loading
 * Only fetches when explicitly called via fetchData()
 * Does NOT auto-fetch on mount
 */
export const useOptimizedCoCurricularsData = (userEmail: string | null): UseCoCurricularsDataReturn => {
  const [clubs, setClubs] = useState<SchoolClub[]>([]);
  const [achievements, setAchievements] = useState<SchoolAchievement[]>([]);
  const [certificates, setCertificates] = useState<SchoolCertificate[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<SchoolActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userEmail || hasFetched) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasFetched(true);

      const { data } = await apiPost('/co-curriculars/actions', {
        action: 'fetch-co-curriculars',
        userEmail: userEmail,
      });
      const membershipData = { data: data?.memberships || [], error: null };
      const resultsData = { data: data?.results || [], error: null };
      const certificatesData = { data: data?.certificates || [], error: null };
      const allMemberCounts = { data: data?.memberCounts || [], error: null };

      if (membershipData.error) throw membershipData.error;

      // Build member count map from the parallel query
      const countMap = new Map<string, number>();
      allMemberCounts.data?.forEach((membership: any) => {
        const count = countMap.get(membership.club_id) || 0;
        countMap.set(membership.club_id, count + 1);
      });

      // Process clubs
      if (membershipData.data && membershipData.data.length > 0) {
        const clubsData = membershipData.data.map((membership: any) => ({
          club_id: membership.clubs?.club_id,
          name: membership.clubs?.name,
          category: membership.clubs?.category,
          description: membership.clubs?.description || '',
          meeting_day: membership.clubs?.meeting_day,
          meeting_time: membership.clubs?.meeting_time,
          location: membership.clubs?.location,
          is_active: membership.clubs?.is_active,
          capacity: membership.clubs?.capacity || 30,
          membership_id: membership.membership_id,
          enrolled_at: membership.enrolled_at,
          total_sessions_attended: membership.total_sessions_attended,
          total_sessions_held: membership.total_sessions_held,
          attendance_percentage: membership.attendance_percentage,
          performance_score: membership.performance_score,
          memberCount: countMap.get(membership.clubs?.club_id) || 0,
          avgAttendance: Math.round(membership.attendance_percentage || 0),
          upcomingActivities: [],
          meetingDay: membership.clubs?.meeting_day || 'TBD',
          meetingTime: membership.clubs?.meeting_time || 'TBD',
          mentor_type: '',
          mentor_name: ''
        }));

        setClubs(clubsData as any);

        // Generate activities
        const activities: SchoolActivity[] = [];
        clubsData.forEach((club: any) => {
          if (club.meeting_day && club.meeting_time) {
            const clubName = formatClubName(club.name);
            activities.push({
              title: `${clubName} Meeting`,
              clubName,
              date: new Date(),
              type: 'meeting'
            });
          }
        });
        setUpcomingActivities(activities.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ));
      }

      // Process achievements
      if (resultsData.data) {
        const achievementsData = resultsData.data
          .filter((result: any) => result.competitions)
          .map((result: any) => {
            const competition = normalizeRelation(result.competitions);
            return {
              result_id: result.result_id,
              name: competition?.name || '',
              rank: result.rank,
              score: result.score,
              award: result.award || 'Participant',
              level: competition?.level || 'School',
              category: competition?.category || 'General',
              date: competition?.competition_date || '',
              status: competition?.status || '',
              notes: result.performance_notes
            };
          })
          .sort((a: any, b: any) => a.rank - b.rank);
        setAchievements(achievementsData);
      }

      // Process certificates
      if (certificatesData.data) {
        const processedCertificates = certificatesData.data.map((cert: any) => ({
          ...cert,
          competitions: normalizeRelation(cert.competitions) || { name: '', level: '', category: '' }
        }));
        setCertificates(processedCertificates);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userEmail, hasFetched]);

  return { clubs, achievements, certificates, upcomingActivities, loading, error, fetchData };
};
