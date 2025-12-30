import express from "express";
import { getFirestore } from "firebase-admin/firestore";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const limitParam = req.query.limit ? Number(req.query.limit) : 50;
    const limitCount = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 200)
      : 50;

    const db = getFirestore();

    const snap = await db
      .collection("agentRuns")
      .orderBy("createdAt", "desc")
      .limit(limitCount)
      .get();

    const runs = snap.docs.map((d) => {
      const data = d.data();

      // Convert Firestore Timestamp to millis for the client
      const createdAtMs = data?.createdAt?.toMillis?.() ?? null;

      return {
        id: d.id,
        ...data,
        createdAtMs,
      };
    });

    res.json({ runs });
  } catch (e) {
    res.status(500).json({ error: e?.message ?? "Failed to load runs" });
  }
});

export default router;
