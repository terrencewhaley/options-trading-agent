import express from "express";
import { getDailyCandles } from "../services/polygon.js";
import { calculateEMA } from "../indicators/ema.js";
import { getTrendBias } from "../logic/trendBias.js";
import { detectSupport } from "../logic/support.js";
import { recommendTrade } from "../logic/tradeRecommend.js";
import { getSpreadCredit } from "../quotes/getSpreadCredit.js";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

if (!getApps().length) initializeApp();
const db = getFirestore();

const router = express.Router();

router.get("/", async (req, res) => {
  const ticker = req.query.ticker ?? "SPY";

  const candles = await getDailyCandles(ticker);
  const supportInfo = detectSupport(candles, 15, 0.002);

  const closes = candles.map((c) => c.c);

  const close = closes[closes.length - 1];
  const ema20 = calculateEMA(20, closes);
  const ema50 = calculateEMA(50, closes);
  const bias = getTrendBias(close, ema20, ema50);

  const minRejOverride = req.query.minRejections
    ? Number(req.query.minRejections)
    : null;

  const supportRejectionsForDecision = Number.isFinite(minRejOverride)
    ? minRejOverride
    : supportInfo.rejectionCount;

  const draft = recommendTrade({
    bias,
    support: supportInfo.support,
    // supportRejections: supportInfo.rejectionCount,
    supportRejections: supportRejectionsForDecision,
    credit: null,
  });

  let trade = draft;

  if (draft?.decision === "TRADE") {
    const tradierToken = req.app?.locals?.tradierToken;

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
      // supportRejections: supportInfo.rejectionCount,
      supportRejections: supportRejectionsForDecision,
      credit,
    });
  }

  const runDoc = {
    createdAt: FieldValue.serverTimestamp(),
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
    status: trade?.decision === "TRADE" ? "OPEN" : "NO_TRADE",
    outcome: trade?.decision === "TRADE" ? { status: "PENDING" } : null,
    meta: {
      quoteProvider: process.env.QUOTE_PROVIDER ?? null,
      tradierEnv: process.env.TRADIER_ENV ?? null,
    },
  };

  await db.collection("agentRuns").add(runDoc);

  res.json({
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
  });
});

export default router;
