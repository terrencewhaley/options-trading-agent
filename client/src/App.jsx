import { useMemo, useState } from "react";
import { useAgentRuns } from "./hooks/useAgentRuns";

export default function App() {
  const [ticker, setTicker] = useState("SPY");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const { runs, loading: runsLoading, err: runsErr } = useAgentRuns(50);

  // const apiBase = import.meta.env.VITE_API_BASE_URL;

  const fetchAnalysis = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(
        `/api/analyze?ticker=${encodeURIComponent(ticker)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setErr(e?.message ?? "Failed to fetch");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   fetchAnalysis();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const formatted = useMemo(() => {
    if (!data) return "";

    const { bias, support, trade } = data;

    if (!trade) return "No trade object returned.";

    if (trade.decision !== "TRADE") {
      return [
        `Bias: ${bias}`,
        `Support: ~${support}`,
        "",
        `Decision: NO TRADE`,
        `Reason: ${trade.reason ?? "N/A"}`,
        `Last Updated: ${new Date().toLocaleString()}`,
      ].join("\n");
    }

    const creditText =
      trade.credit == null ? "pending" : `~$${Number(trade.credit).toFixed(2)}`;
    const maxLossText =
      trade.maxLoss == null ? "pending" : `~$${trade.maxLoss}`;
    const width = Number(trade.sellStrike) - Number(trade.buyStrike);
    const credit = Number(trade.credit ?? 0);
    const maxLoss = Number(trade.maxLoss ?? 0);
    const breakeven =
      trade.credit == null ? null : Number(trade.sellStrike) - credit / 100;
    const rr =
      trade.credit == null || trade.maxLoss == null || maxLoss === 0
        ? null
        : credit / maxLoss;

    return [
      `Bias: ${bias}`,
      `Support: ~${support}`,
      "",
      `Suggested trade:`,
      `Sell ${trade.sellStrike} / Buy ${trade.buyStrike} Put`,
      `Exp: ${trade.exp}`,
      `Credit: ${creditText}`,
      `Max loss: ${maxLossText}`,
      `Suggested exit: ${trade.exit ?? "Close at $0.30–$0.40"}`,
      trade.note ? `Note: ${trade.note}` : "",
      `Width: $${width}`,
      breakeven == null ? "" : `Break-even (approx): ${breakeven.toFixed(2)}`,
      trade.credit == null ? "" : `Max profit: ~$${credit.toFixed(2)}`,
      trade.maxLoss == null ? "" : `Max loss: ~$${maxLoss.toFixed(0)}`,
      rr == null ? "" : `R:R (credit/maxLoss): ${(rr * 100).toFixed(1)}%`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [data]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">
            Options Agent
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Decision support for a bullish put credit spread. You stay in
            control.
          </p>
        </div>

        <div className="mb-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-3">
              <label className="block">
                <div className="text-xs text-neutral-400">Ticker</div>
                <input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  className="mt-1 w-32 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-600"
                  placeholder="SPY"
                />
              </label>

              <button
                onClick={fetchAnalysis}
                disabled={loading}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Running..." : "Run Agent"}
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs text-neutral-400">
              <input
                type="checkbox"
                checked={showJson}
                onChange={(e) => setShowJson(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-950"
              />
              Show JSON
            </label>
          </div>

          {err ? (
            <div className="mt-3 rounded-xl border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {err}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-neutral-500">
            Output
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-6 text-neutral-100">
            {formatted || "No data yet."}
          </pre>
        </div>

        {showJson && data ? (
          <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
            <div className="mb-2 text-xs uppercase tracking-wide text-neutral-500">
              Raw JSON
            </div>
            <pre className="overflow-auto whitespace-pre text-xs leading-5 text-neutral-200">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              Run History (latest 50)
            </div>
            {runsLoading ? (
              <div className="text-xs text-neutral-500">Loading…</div>
            ) : null}
          </div>

          {runsErr ? (
            <div className="mb-3 rounded-xl border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {runsErr}
            </div>
          ) : null}

          <div className="overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-400">
                <tr className="border-b border-neutral-800">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Sell/Buy</th>
                  <th className="py-2 pr-3">Exp</th>
                  <th className="py-2 pr-3">Credit</th>
                  <th className="py-2 pr-3">MaxLoss</th>
                  <th className="py-2 pr-3">Outcome</th>
                  <th className="py-2 pr-3">Profit</th>
                </tr>
              </thead>

              <tbody className="text-neutral-100">
                {runs.map((r) => {
                  const createdAt = r.createdAtMs
                    ? new Date(r.createdAtMs)
                    : null;

                  const status = r.status ?? r.trade?.decision ?? "";
                  const sell = r.trade?.sellStrike ?? "";
                  const buy = r.trade?.buyStrike ?? "";
                  const exp = r.trade?.exp ?? "";

                  const credit =
                    r.trade?.credit == null
                      ? ""
                      : `$${Number(r.trade.credit).toFixed(2)}`;
                  const maxLoss =
                    r.trade?.maxLoss == null
                      ? ""
                      : `$${Number(r.trade.maxLoss).toFixed(0)}`;

                  const outcome = r.outcome?.status ?? "";
                  const profit =
                    r.outcome?.profit == null
                      ? ""
                      : `$${Number(r.outcome.profit).toFixed(0)}`;

                  return (
                    <tr key={r.id} className="border-b border-neutral-900">
                      <td className="py-2 pr-3 whitespace-nowrap text-neutral-300">
                        {createdAt ? createdAt.toLocaleString() : ""}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">{status}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {sell !== "" && buy !== "" ? `${sell}/${buy}` : ""}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">{exp}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{credit}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{maxLoss}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{outcome}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{profit}</td>
                    </tr>
                  );
                })}

                {!runsLoading && runs.length === 0 ? (
                  <tr>
                    <td className="py-3 text-neutral-400" colSpan={8}>
                      No runs yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-xs text-neutral-500">
          Not financial advice. This tool does not place trades.
        </p>
      </div>
    </div>
  );
}
