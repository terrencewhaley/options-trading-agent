import functions from "firebase-functions";
import express from "express";
import cors from "cors";
import analyzeRoute from "./routes/analyze.js";

const app = express();
app.use(cors({ origin: true }));

app.get("/", (req, res) => {
  res
    .status(200)
    .send("Options Trading Agent API (Firebase Functions) is running.");
});

app.use("/analyze", analyzeRoute);

export const api = functions.https.onRequest(app);
