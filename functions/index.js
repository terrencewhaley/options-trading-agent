import express from "express";
import cors from "cors";
import analyzeRoute from "./routes/analyze.js";

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const POLYGON_API_KEY = defineSecret("POLYGON_API_KEY");

const app = express();
app.use(cors({ origin: true }));
app.use("/analyze", analyzeRoute);

export const api = onRequest({ secrets: [POLYGON_API_KEY] }, app);
