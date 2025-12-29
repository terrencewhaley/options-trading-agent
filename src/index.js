import express from "express";
import dotenv from "dotenv";
import analyzeRoute from "./routes/analyze.js";
import cors from "cors";

dotenv.config();

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://terrencewhaley.com",
  "https://www.terrencewhaley.com",
  "https://options-trading-agent--options-trading-agent.us-east4.hosted.app/",
  "https://options-trading-agent.web.app/",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/postman
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
  })
);

app.use("/analyze", analyzeRoute);

app.listen(process.env.PORT, () => {
  console.log(`Agent running on port ${process.env.PORT}`);
});
