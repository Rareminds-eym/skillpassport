import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/shared/api/apiClient";
import {
  LoadState,
  useWorkspaceKey,
} from "@/pages/recruiter/shared/RecruitmentControls";
export const TeamAnalytics = () => {
  const query = useQuery({
    queryKey: useWorkspaceKey("team-analytics"),
    queryFn: async () => {
      const response = await apiGet<any>("/recruiter/team-analytics");
      if (!response.success)
        throw new Error(
          response.error?.message || "Team analytics could not be loaded",
        );
      return response.data;
    },
  });
  if (query.isLoading || query.isError)
    return (
      <LoadState
        loading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
      />
    );
  const rows = query.data?.members || [],
    sourced = rows.reduce((sum: number, row: any) => sum + row.sourced, 0),
    hired = rows.reduce((sum: number, row: any) => sum + row.hired, 0);
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Team performance
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Current organization pipeline records, attributed to the member who
          sourced each candidate.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Active members", rows.length],
          ["Candidates sourced", sourced],
          ["Candidates hired", hired],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <p className="text-sm text-gray-600">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Recruitment performance by active team member
          </caption>
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              {["Member", "Sourced", "Hired", "Average days to hire"].map(
                (label) => (
                  <th key={label} scope="col" className="px-5 py-3">
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id} className="border-t border-gray-200">
                <th scope="row" className="px-5 py-4 font-medium text-gray-900">
                  {row.name}
                  <span className="block font-normal text-gray-600">
                    {row.email}
                  </span>
                </th>
                <td className="px-5 py-4">{row.sourced}</td>
                <td className="px-5 py-4">{row.hired}</td>
                <td className="px-5 py-4">{row.averageDays ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="p-6 text-gray-600">No active team members.</p>
        )}
      </div>
      {query.data?.unattributedCandidates > 0 && (
        <p className="text-sm text-gray-600">
          {query.data.unattributedCandidates} candidate records have no active
          team member attribution.
        </p>
      )}
    </section>
  );
};
