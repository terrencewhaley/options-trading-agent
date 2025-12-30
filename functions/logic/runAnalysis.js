import { getDailyCandles } from "../services/polygon.js";
import { calculateEMA } from "../indicators/ema.js";
import { getTrendBias } from "../logic/trendBias.js";
import { detectSupport } from "../logic/support.js";
import { recommendTrade } from "../logic/tradeRecommend.js";
import { getSpreadCredit } from "../quotes/getSpreadCredit.js";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const runAnalysis = async (
  { ticker, minRejectionsOverride },
  { tradierToken } = {}
) => {
  const candles = await getDailyCandles(ticker);
  const supportInfo = detectSupport(candles, 15, 0.002);

  const closes = candles.map((c) => c.c);
  const close = closes[closes.length - 1];

  const ema20 = calculateEMA(20, closes);
  const ema50 = calculateEMA(50, closes);
  const bias = getTrendBias(close, ema20, ema50);

  const supportRejectionsForDecision = Number.isFinite(minRejectionsOverride)
    ? minRejectionsOverride
    : supportInfo.rejectionCount;

  const draft = recommendTrade({
    bias,
    support: supportInfo.support,
    supportRejections: supportRejectionsForDecision,
    credit: null,
  });

  let trade = draft;

  if (draft?.decision === "TRADE") {
    const credit = await getSpreadCredit(
      {
        underlying: ticker,
        exp: draft.exp,
        sellStrike: draft.sellStrike,
        buyStrike: draft.buyStrike,
      },
      { tradierToken }
    );

    trade = recommendTrade({
      bias,
      support: supportInfo.support,
      supportRejections: supportRejectionsForDecision,
      credit,
    });
  }

  const payload = {
    ticker,
    close,
    ema20,
    ema50,
    bias,
    support: supportInfo.support,
    supportSwingDate: supportInfo.swingDate,
    supportRejections: supportInfo.rejectionCount,
    supportRejectionDates: supportInfo.rejectionDates,
    trade,
  };

  // Log to Firestore
  const db = getFirestore();
  const runDoc = {
    createdAt: FieldValue.serverTimestamp(),
    ...payload,
    status: trade?.decision === "TRADE" ? "OPEN" : "NO_TRADE",
    outcome: trade?.decision === "TRADE" ? { status: "PENDING" } : null,
    meta: {
      quoteProvider: process.env.QUOTE_PROVIDER ?? null,
      tradierEnv: process.env.TRADIER_ENV ?? null,
      source: "scheduled_or_http",
    },
  };

  await db.collection("agentRuns").add(runDoc);

  return payload;
};
