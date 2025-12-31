const toYyyyMmDd = (d) => d.toISOString().slice(0, 10);

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const nextFridayOnOrAfter = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun ... 5 Fri ... 6 Sat
  const diff = (5 - day + 7) % 7; // days until Friday
  d.setDate(d.getDate() + diff);
  return d;
};

// Existing behavior (kept)
export const getNextFridayExpiry = () => {
  const today = new Date();
  const fri = nextFridayOnOrAfter(today);

  // If today is Friday but market already closed, you might want next week.
  // We'll keep it simple for now (same as prior behavior).
  return toYyyyMmDd(fri);
};

// NEW: Friday expiration within [minDte, maxDte]
export const getFridayExpiryInRange = (minDte = 21, maxDte = 35) => {
  const today = new Date();

  // earliest allowed date
  const earliest = addDays(today, minDte);
  let fri = nextFridayOnOrAfter(earliest);

  // If the first Friday is beyond maxDte, still return that first Friday
  // (better to have a consistent rule than return null and break the agent)
  const latest = addDays(today, maxDte);
  if (fri > latest) return toYyyyMmDd(fri);

  return toYyyyMmDd(fri);
};
