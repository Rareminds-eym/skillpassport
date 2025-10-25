import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

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
      console.log("🔍 [useRecentUpdates] Finding student by email:", email);

      const { data, error } = await supabase
        .from("students")
        .select("id, profile")
        .eq("profile->>email", email)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        console.warn("⚠️ No student found with email:", email);
        setStudentId(null);
        return null;
      }

      console.log("✅ [useRecentUpdates] Found student ID:", data.id);
      setStudentId(data.id);
      return data.id;
    } catch (err) {
      console.error("❌ [useRecentUpdates] Error finding student by email:", err);
      setError(err.message);
      setStudentId(null);
      return null;
    }
  };

  // 2️⃣ Fetch recent updates by student_id
  const fetchRecentUpdates = async (resolvedId) => {
    if (!resolvedId) {
      console.warn("⚠️ [useRecentUpdates] No studentId, skipping updates fetch.");
      return;
    }

    try {
      setLoading(true);
      console.log("🚀 [useRecentUpdates] Fetching recent updates for:", resolvedId);

      const { data, error: updatesError } = await supabase
        .from("recent_updates")
        .select("*")
        .eq("student_id", resolvedId)
        .maybeSingle();

      if (updatesError) throw updatesError;

      if (!data) {
        console.log("📝 No recent_updates record found.");
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
        console.error("❌ Error parsing updates JSON:", parseErr);
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

      console.log("✅ [useRecentUpdates] Updates fetched & formatted:", formatted.length);
      setRecentUpdates(formatted);
    } catch (err) {
      console.error("❌ [useRecentUpdates] Error fetching updates:", err);
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
      console.warn("⚠️ [useRecentUpdates] No email found in localStorage.");
      setLoading(false);
      return;
    }

    console.log("📧 [useRecentUpdates] Using email from localStorage:", email);
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
    console.log("🔄 [useRecentUpdates] Manual refresh triggered...");
    if (studentId) await fetchRecentUpdates(studentId);
    else console.warn("⚠️ Cannot refresh — studentId is null");
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
