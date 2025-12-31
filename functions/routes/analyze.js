import express from "express";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { runAnalysis } from "../logic/runAnalysis.js";

if (!getApps().length) initializeApp();
const db = getFirestore();

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const ticker = req.query.ticker ?? "SPY";
    const minRejOverride = req.query.minRejections
      ? Number(req.query.minRejections)
      : null;

    const tradierToken = req.app?.locals?.tradierToken;

    const payload = await runAnalysis(
      {
        ticker,
        minRejectionsOverride: Number.isFinite(minRejOverride)
          ? minRejOverride
          : null,
      },
      { tradierToken }
    );

    res.json(payload);
  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({
      error: err?.message ?? String(err),
      stack: process.env.NODE_ENV === "production" ? undefined : err?.stack,
    });
  }
});

export default router;
