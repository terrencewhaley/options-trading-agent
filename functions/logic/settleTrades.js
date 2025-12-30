import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getDailyCloseOnDate } from "../services/polygon.js";

const yyyyMmDdToday = () => new Date().toISOString().slice(0, 10);

const compareDateStrings = (a, b) => {
  // both YYYY-MM-DD
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

export const settleOpenTrades = async () => {
  const db = getFirestore();
  const today = yyyyMmDdToday();

  const snap = await db
    .collection("agentRuns")
    .where("status", "==", "OPEN")
    .get();

  if (snap.empty) return { checked: 0, settled: 0 };

  let settled = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const exp = data?.trade?.exp;
    const ticker = data?.ticker;
    const sellStrike = data?.trade?.sellStrike;
    const buyStrike = data?.trade?.buyStrike;
    const credit = data?.trade?.credit;

    // Basic guards
    if (
      !exp ||
      !ticker ||
      sellStrike == null ||
      buyStrike == null ||
      credit == null
    )
      continue;

    // Only settle AFTER expiration date (or on it, if you run Saturday it will be past)
    if (compareDateStrings(exp, today) === 1) continue; // exp > today

    const closeAtExp = await getDailyCloseOnDate(ticker, exp);

    if (closeAtExp == null) {
      // Market holiday / data gap — mark unknown so it doesn’t loop forever
      await doc.ref.update({
        outcome: {
          status: "UNKNOWN",
          reason: `No Polygon close found for ${exp}`,
          settledAt: FieldValue.serverTimestamp(),
        },
        status: "CLOSED",
      });
      settled += 1;
      continue;
    }

    const width = Number(sellStrike) - Number(buyStrike);
    const maxLoss = width * 100 - Number(credit);

    let profit;
    let outcomeStatus;

    if (closeAtExp >= sellStrike) {
      // spread expires worthless
      profit = Number(credit);
      outcomeStatus = "WIN";
    } else if (closeAtExp <= buyStrike) {
      // full loss
      profit = -Number(maxLoss);
      outcomeStatus = "LOSS";
    } else {
      // partial intrinsic loss
      const intrinsicLoss = (sellStrike - closeAtExp) * 100;
      profit = Number(credit) - intrinsicLoss;

      // Clamp to [-maxLoss, +credit]
      profit = Math.max(-Number(maxLoss), Math.min(Number(credit), profit));

      outcomeStatus = profit >= 0 ? "WIN" : "PARTIAL";
    }

    // Round to whole dollars (optional)
    profit = Number(profit.toFixed(0));

    await doc.ref.update({
      status: "CLOSED",
      outcome: {
        status: outcomeStatus,
        exp,
        underlyingCloseAtExp: closeAtExp,
        profit,
        credit: Number(credit),
        maxLoss: Number(maxLoss.toFixed(0)),
        settledAt: FieldValue.serverTimestamp(),
      },
    });

    settled += 1;
  }

  return { checked: snap.size, settled };
};
