import { apiGet, apiPost } from "@/shared/api/apiClient";
/**
 * Recruitment Onboarding - Step 2: Recruitment Settings
 *
 * Combines team settings and recruitment preferences into one step.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useOnboarding } from "./OnboardingContext";

export default function OnboardingStep2() {
  const navigate = useNavigate();
  const { data, updateTeamSettings } = useOnboarding();

  const [teamSettings, setTeamSettings] = useState(data.teamSettings);
  const [loading, setLoading] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    apiGet<any>("/recruiter/team-settings")
      .then((result) => {
        if (!active) return;
        setLoaded(true);
        setCanManage(result.data.canManage);
        setTeamSettings((previous) => ({
          ...previous,
          maxRecruiters: result.data.maxRecruiters,
          requireApproval: result.data.requireApproval,
        }));
      })
      .catch((error) => {
        if (active) setError(error.message);
      })
      .finally(() => {
        if (active) setFetching(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loaded) return;
    setLoading(true);

    try {
      setError("");
      if (canManage)
        await apiPost("/recruiter/team-settings", {
          maxRecruiters: teamSettings.maxRecruiters,
          requireApproval: teamSettings.requireApproval,
        });
      updateTeamSettings(teamSettings);

      if (canManage) toast.success("Recruitment settings saved!");
      navigate("/recruitment/onboarding/step-3");
    } catch (error: any) {
      setError(error.message || "Failed to save recruitment settings");
      toast.error(error.message || "Failed to save recruitment settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-slate-200">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Recruitment Settings
        </h2>
        <p className="text-slate-600">
          Configure your team structure and recruitment workflow
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
            {!loaded && (
              <button
                type="button"
                onClick={() => {
                  setFetching(true);
                  setError("");
                  setRetry((n) => n + 1);
                }}
                className="ml-2 underline"
              >
                Retry loading settings
              </button>
            )}
          </div>
        )}
        {!fetching && !canManage && (
          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            Your organization administrator manages these settings. You can
            review them and continue.
          </p>
        )}
        {/* Team Settings */}
        <section className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Team Settings
          </h3>

          <div className="space-y-2 rounded-xl  px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800">
                  Maximum Recruiters
                </label>
                <p className="text-xs text-slate-500">
                  Number of team members who can post jobs and manage candidates
                </p>
              </div>
              <span className="text-xl font-bold text-blue-600 min-w-[48px] text-right">
                {teamSettings.maxRecruiters}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                aria-label="Maximum recruiters"
                type="range"
                disabled={!canManage || fetching || loading}
                min="1"
                max="50"
                value={teamSettings.maxRecruiters}
                onChange={(e) =>
                  setTeamSettings((prev) => ({
                    ...prev,
                    maxRecruiters: parseInt(e.target.value),
                  }))
                }
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-slate-200 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Require Approval for Job Posts
              </h3>
              <p className="text-xs text-slate-500">
                All job posts must be approved by an admin before going live
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                aria-label="Require approval for job posts"
                type="checkbox"
                disabled={!canManage || fetching || loading}
                checked={teamSettings.requireApproval}
                onChange={(e) =>
                  setTeamSettings((prev) => ({
                    ...prev,
                    requireApproval: e.target.checked,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </section>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate("/recruitment/onboarding/step-1")}
            className="px-6 py-4 rounded-xl font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <button
            aria-label="Action"
            type="submit"
            disabled={loading || fetching || !loaded}
            className="flex-1 py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Review & Complete</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
