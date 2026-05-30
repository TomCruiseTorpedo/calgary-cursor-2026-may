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
import { getOpenRouterConfig } from "./lib/openrouter-client.js";
import { parseCreatePayload } from "./lib/parse-create-payload.js";
import { optionalScreenshotUpload } from "./lib/upload-middleware.js";
import { readAttachmentFile } from "./lib/attachments.js";

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

app.get("/api/config", (_req, res) => {
  res.json(getOpenRouterConfig());
});

app.post("/api/requests", optionalScreenshotUpload, async (req, res) => {
  const payload = parseCreatePayload(req);

  if (
    !payload.wish ||
    !payload.requesterLabel ||
    !payload.audience ||
    !payload.frequency ||
    !payload.success
  ) {
    return res.status(400).json({
      error:
        "wish, requesterLabel, audience, frequency, and success are required",
    });
  }

  try {
    const created = await createRequest({
      wish: payload.wish,
      audience: payload.audience,
      frequency: payload.frequency,
      success: payload.success,
      requesterLabel: payload.requesterLabel,
      clarify: payload.clarify,
      clarifyNotes: payload.clarifyNotes,
      useLlm: payload.useLlm,
      screenshot: payload.screenshot,
    });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    const message =
      err.message?.includes("image") || err.message?.includes("5 MB")
        ? err.message
        : "Failed to save request";
    res.status(500).json({ error: message });
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

app.get("/api/requests/:id/attachment", async (req, res) => {
  try {
    const file = await readAttachmentFile(req.params.id);
    if (!file) return res.status(404).json({ error: "Not found" });
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.send(file.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load attachment" });
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

export default app;
export { app };

const isLocalServer =
  process.env.NODE_ENV !== "test" && !process.env.VERCEL;

if (isLocalServer) {
  await ensureRequestsDir();
  app.listen(PORT, () => {
    console.log(`Plain Jane's Task Ask → http://localhost:${PORT}`);
    console.log(`  Request: http://localhost:${PORT}/request`);
    console.log(`  Inbox:   http://localhost:${PORT}/inbox`);
  });
}
