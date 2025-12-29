export const getNextFridayExpiry = () => {
  const today = new Date();

  // start 7 days out
  const start = new Date(today);
  start.setDate(start.getDate() + 7);

  // find the first Friday within the next 7 days (7–14 DTE window)
  for (let i = 0; i <= 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d.getDay() === 5) return d.toISOString().slice(0, 10);
  }

  // fallback: next Friday from today
  const d = new Date(today);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};
