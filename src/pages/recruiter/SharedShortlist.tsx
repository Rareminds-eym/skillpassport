import { useEffect, useState } from "react";
export default function SharedShortlist() {
  const [result, setResult] = useState<any>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/shortlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "read",
        token: window.location.hash.slice(1),
      }),
      signal: controller.signal,
      cache: "no-store",
      referrerPolicy: "no-referrer",
    })
      .then(async (response) => {
        const payload = await response.json() as {success:boolean;data:unknown;error?:{message?:string}};
        if (!response.ok || !payload.success)
          throw new Error(payload.error?.message || "This link is unavailable");
        setResult(payload.data);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, []);
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 text-gray-900">
      <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6 sm:p-10">
        <p className="text-sm font-medium text-primary-800">
          SkillPassport · Shared shortlist
        </p>
        {error ? (
          <p role="alert" className="mt-5 text-red-800">
            {error}
          </p>
        ) : !result ? (
          <p role="status" className="mt-5">
            Loading shortlist…
          </p>
        ) : (
          <>
            <h1 className="mt-3 text-3xl font-semibold">{result.name}</h1>
            <p className="mt-3 text-gray-600">{result.description}</p>
            <p className="mt-3 text-sm text-gray-600">
              Expires {new Date(result.expiresAt).toLocaleDateString()}. Contact
              information and internal notes are private.
            </p>
            <ul className="mt-8 divide-y divide-gray-200">
              {result.candidates.map((candidate: any, index: number) => (
                <li key={index} className="py-5">
                  <h2 className="font-semibold">
                    {candidate.name || "Candidate"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {[candidate.university, candidate.branch_field]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
            {!result.candidates.length && (
              <p className="mt-8 text-gray-600">
                No candidates in this shortlist.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
