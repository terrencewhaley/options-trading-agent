import { useEffect, useState } from "react";

export function useAgentRuns(limit = 50) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setErr("");
      try {
        const res = await fetch(`/api/runs?limit=${encodeURIComponent(limit)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (!cancelled) {
          setRuns(json?.runs ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message ?? "Failed to load runs");
          setRuns([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // keep loading=true on first mount; only set false after fetch returns
    setLoading(true);
    load();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { runs, loading, err };
}
