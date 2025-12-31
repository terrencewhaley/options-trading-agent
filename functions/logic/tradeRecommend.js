import { config } from "../config.js";
import { getFridayExpiryInRange } from "./expiry.js";

export const recommendTrade = ({
  bias,
  support,
  supportRejections,
  premium = null, // dollars per contract (e.g., 75 means $75)
  close = null, // underlying last close (optional; helps pick strike)
}) => {
  if (bias !== "Bullish") {
    return { decision: "NO TRADE", reason: `Bias is ${bias}` };
  }

  if (supportRejections < config.minSupportRejections) {
    return {
      decision: "NO TRADE",
      reason: `Support not confirmed (need >= ${config.minSupportRejections} rejections)`,
    };
  }

  // Expiration: first Friday within DTE range
  const exp = getFridayExpiryInRange(config.minDte, config.maxDte);

  // Strike selection:
  // Prefer ATM-ish based on close if provided; otherwise fall back to support-rounded.
  // Keep it simple and stable.
  const ref = Number.isFinite(close) ? close : support;
  const callStrike = Math.round(ref); // simplest ATM-ish selection

  // If we don't have live premium yet, still return the shape
  if (premium == null) {
    return {
      decision: "TRADE",
      strategy: "Long Call",
      callStrike,
      exp,
      premium: null,
      maxLoss: null,
      exit: {
        type: "PCT_OF_ENTRY",
        takeProfitPct: config.takeProfitPct,
        stopLossPct: config.stopLossPct,
      },
      note: "Premium/maxLoss pending live options data",
    };
  }

  const prem = Number(premium);

  if (!Number.isFinite(prem) || prem <= 0) {
    return { decision: "NO TRADE", reason: "Invalid premium returned" };
  }

  if (prem > config.maxPremiumCap) {
    return {
      decision: "NO TRADE",
      reason: `Premium $${prem.toFixed(0)} exceeds cap $${
        config.maxPremiumCap
      }`,
      proposed: { callStrike, exp, premium: prem },
    };
  }
  const takeProfitAt = Math.round(prem * (1 + config.takeProfitPct));
  const stopLossAt = Math.round(prem * (1 - config.stopLossPct));

  return {
    decision: "TRADE",
    strategy: "Long Call",
    callStrike,
    exp,
    premium: Math.round(prem),
    maxLoss: Math.round(prem),
    exit: {
      type: "PCT_OF_ENTRY",
      takeProfitPct: config.takeProfitPct,
      stopLossPct: config.stopLossPct,
      takeProfitAt,
      stopLossAt,
    },
  };
};
