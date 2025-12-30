import express from "express";
import cors from "cors";
import analyzeRoute from "./routes/analyze.js";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

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

export const api = onRequest(
  { secrets: [POLYGON_API_KEY, TRADIER_TOKEN] },
  app
);
