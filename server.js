import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createRequest,
  listRequests,
  getRequest,
  updateRequestStatus,
  cursorCopyText,
  issueDraftFromBody,
  ensureRequestsDir,
} from "./lib/requests-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: "64kb" }));

app.get("/", (_req, res) => {
  res.redirect(302, "/request");
});

app.use("/request", express.static(path.join(__dirname, "public", "request")));
app.use("/inbox", express.static(path.join(__dirname, "public", "inbox")));
app.use("/shared", express.static(path.join(__dirname, "public", "shared")));

app.post("/api/requests", async (req, res) => {
  const { wish, audience, frequency, success, requesterLabel, clarify, clarifyNotes } =
    req.body || {};

  if (!wish?.trim() || !audience?.trim() || !frequency?.trim() || !success?.trim()) {
    return res.status(400).json({
      error: "wish, audience, frequency, and success are required",
    });
  }

  try {
    const created = await createRequest({
      wish: wish.trim(),
      audience: audience.trim(),
      frequency: frequency.trim(),
      success: success.trim(),
      requesterLabel: requesterLabel?.trim(),
      clarify: Array.isArray(clarify) ? clarify : [],
      clarifyNotes: clarifyNotes?.trim(),
    });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save request" });
  }
});

app.get("/api/requests", async (_req, res) => {
  try {
    const items = await listRequests();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list requests" });
  }
});

app.get("/api/requests/:id", async (req, res) => {
  try {
    const request = await getRequest(req.params.id);
    if (!request) return res.status(404).json({ error: "Not found" });
    res.json({
      ...request,
      cursorCopy: cursorCopyText(request),
      issueDraft: issueDraftFromBody(request.body),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load request" });
  }
});

app.patch("/api/requests/:id", async (req, res) => {
  const { status } = req.body || {};
  if (!status) {
    return res.status(400).json({ error: "status is required" });
  }
  try {
    const updated = await updateRequestStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    if (err.message?.startsWith("Invalid status")) {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update request" });
  }
});

export { app };

if (process.env.NODE_ENV !== "test") {
  await ensureRequestsDir();
  app.listen(PORT, () => {
    console.log(`Plain Jane's Task Ask → http://localhost:${PORT}`);
    console.log(`  Request: http://localhost:${PORT}/request`);
    console.log(`  Inbox:   http://localhost:${PORT}/inbox`);
  });
}
