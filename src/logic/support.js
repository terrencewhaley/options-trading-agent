// Support detection on daily candles (last ~15 trading days)

export const detectSupport = (candles, lookback = 15, tolerancePct = 0.002) => {
  const recent = candles.slice(-lookback);

  // Find most recent swing low: low[i] lower than neighbors
  let swingIdx = -1;
  for (let i = recent.length - 2; i >= 1; i--) {
    const prev = recent[i - 1].l;
    const curr = recent[i].l;
    const next = recent[i + 1].l;

    if (curr < prev && curr < next) {
      swingIdx = i;
      break;
    }
  }

  // Fallback: if no swing low found, use lowest low in lookback
  if (swingIdx === -1) {
    let minLow = Infinity;
    for (let i = 0; i < recent.length; i++) {
      if (recent[i].l < minLow) {
        minLow = recent[i].l;
        swingIdx = i;
      }
    }
  }

  const support = recent[swingIdx].l;
  const tol = support * tolerancePct;

  // Count rejections: low near/under support+tolerance AND close above support
  let rejectionCount = 0;
  const rejectionDates = [];

  for (const c of recent) {
    const lowNearSupport = c.l <= support + tol;
    const closedAbove = c.c > support;

    if (lowNearSupport && closedAbove) {
      rejectionCount++;
      rejectionDates.push(new Date(c.t).toISOString().slice(0, 10));
    }
  }

  return {
    support: round2(support),
    swingDate: new Date(recent[swingIdx].t).toISOString().slice(0, 10),
    rejectionCount,
    rejectionDates,
  };
};

function round2(n) {
  return Number(n.toFixed(2));
}
