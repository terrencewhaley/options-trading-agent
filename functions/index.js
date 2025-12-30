import express from "express";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";

import analyzeRoute from "./routes/analyze.js";

const app = express();
app.use(cors({ origin: true }));

app.get("/", (req, res) => {
  res
    .status(200)
    .send("Options Trading Agent API (Firebase Functions) is running.");
});

app.use("/analyze", analyzeRoute);

// 2nd gen functions
export const api = onRequest(app);
