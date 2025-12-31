import express from "express";
import cors from "cors";
import analyzeRoute from "./routes/analyze.js";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp, getApps } from "firebase-admin/app";
import { runAnalysis } from "./logic/runAnalysis.js";
import { settleOpenTrades } from "./logic/settleTrades.js";
import runsRoute from "./routes/runs.js";

if (!getApps().length) initializeApp();

const POLYGON_API_KEY = defineSecret("POLYGON_API_KEY");
const TRADIER_TOKEN = defineSecret("TRADIER_TOKEN");

const app = express();
app.use(cors({ origin: true }));

app.use((req, _res, next) => {
  if (req.url.startsWith("/api/")) req.url = req.url.replace(/^\/api/, "");
  next();
});

app.use((req, _res, next) => {
  req.app.locals.tradierToken = TRADIER_TOKEN.value();
  next();
});

app.get("/", (_req, res) => {
  res.send("Options Trading Agent API (Firebase Functions) is running.");
});

app.use("/analyze", analyzeRoute);

app.use("/runs", runsRoute);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err?.message ?? "Internal Server Error" });
});

export const weeklyAgentRun = onSchedule(
  {
    schedule: "0 10 * * 1", // Mondays 10:00
    timeZone: "America/Los_Angeles",
    secrets: [POLYGON_API_KEY, TRADIER_TOKEN],
  },
  async () => {
    const ticker = "SPY";
    const tradierToken = TRADIER_TOKEN.value();

    await runAnalysis({ ticker }, { tradierToken });
  }
);

export const weeklySettle = onSchedule(
  {
    schedule: "0 9 * * 6", // Saturday 9:00 AM
    timeZone: "America/Los_Angeles",
    secrets: [POLYGON_API_KEY], // only needs Polygon
  },
  async () => {
    const result = await settleOpenTrades();
    console.log("weeklySettle:", result);
  }
);

export const api = onRequest(
  { secrets: [POLYGON_API_KEY, TRADIER_TOKEN] },
  app
);
