import { useState, useEffect } from "react";
import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('recent-updates-hook');

// 🕓 Helper — format timestamps into “2 min ago” / “Oct 24” etc.
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;

  if (isNaN(diffMs)) return "Unknown time";

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export const useRecentUpdates = () => {
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  // 1️⃣ Resolve student ID by email
  const fetchStudentIdByEmail = async (email) => {
    try {

      const { data, error } = await supabase
        .from("students")
        .select("id, profile")
        .eq("profile->>email", email)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setStudentId(null);
        return null;
      }

      setStudentId(data.id);
      return data.id;
    } catch (err) {
      logger.error('Failed to find student by email', err instanceof Error ? err : new Error(String(err)), { email });
      setError(err.message);
      setStudentId(null);
      return null;
    }
  };

  // 2️⃣ Fetch recent updates by student_id
  const fetchRecentUpdates = async (resolvedId) => {
    if (!resolvedId) {
      return;
    }

    try {
      setLoading(true);

      const { data, error: updatesError } = await supabase
        .from("recent_updates")
        .select("*")
        .eq("student_id", resolvedId)
        .maybeSingle();

      if (updatesError) throw updatesError;

      if (!data) {
        setRecentUpdates([]);
        return;
      }

      // Safely parse JSONB and clean data
      let updatesArray = [];
      try {
        const parsed =
          typeof data.updates === "string"
            ? JSON.parse(data.updates)
            : data.updates;

        updatesArray = (parsed?.updates || []).filter(Boolean);
      } catch (parseErr) {
        logger.error('Failed to parse recent updates JSON', parseErr instanceof Error ? parseErr : new Error(String(parseErr)));
      }

      // Format timestamps properly
      const formatted = updatesArray.map((u) => {
        const realTimestamp =
          u.created_at && u.created_at !== "Just now"
            ? u.created_at
            : new Date().toISOString();

        return {
          ...u,
          timestamp: formatTimestamp(realTimestamp),
          rawTimestamp: realTimestamp,
        };
      });

      setRecentUpdates(formatted);
    } catch (err) {
      logger.error('Failed to fetch recent updates', err instanceof Error ? err : new Error(String(err)));
      setError(err.message);
      setRecentUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ Get user email and fetch studentId
  useEffect(() => {
    const email =
      localStorage.getItem("userEmail") ||
      localStorage.getItem("email") ||
      null;

    if (!email) {
      setLoading(false);
      return;
    }

    setUserEmail(email);
    fetchStudentIdByEmail(email);
  }, []);

  // 4️⃣ Once studentId is available, fetch updates
  useEffect(() => {
    if (studentId) fetchRecentUpdates(studentId);
  }, [studentId]);

  // 5️⃣ Auto-refresh timestamps every 60s
  useEffect(() => {
    if (recentUpdates.length === 0) return;
    const interval = setInterval(() => {
      setRecentUpdates((prev) =>
        prev.map((u) => ({
          ...u,
          timestamp: formatTimestamp(u.rawTimestamp),
        }))
      );
    }, 60000);
    return () => clearInterval(interval);
  }, [recentUpdates.length]);

  const refreshRecentUpdates = async () => {
    if (studentId) await fetchRecentUpdates(studentId);
  };

  return {
    recentUpdates,
    loading,
    error,
    refreshRecentUpdates,
    studentId,
    userEmail,
  };
};
