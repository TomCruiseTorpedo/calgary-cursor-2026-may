/**
 * Normalize POST /api/requests body from JSON or multipart form fields.
 * @param {import('express').Request} req
 */
export function parseCreatePayload(req) {
  const body = req.body || {};
  let clarify = body.clarify;
  if (typeof clarify === "string" && clarify.trim()) {
    try {
      clarify = JSON.parse(clarify);
    } catch {
      clarify = [];
    }
  }
  if (!Array.isArray(clarify)) clarify = [];

  const useLlm =
    body.useLlm === true ||
    body.useLlm === "true" ||
    body.useLlm === "1";

  return {
    wish: String(body.wish || "").trim(),
    requesterLabel: String(body.requesterLabel || "").trim(),
    audience: String(body.audience || "").trim(),
    frequency: String(body.frequency || "").trim(),
    success: String(body.success || "").trim(),
    clarify,
    clarifyNotes: String(body.clarifyNotes || "").trim(),
    useLlm,
    screenshot: req.file
      ? {
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
          originalname: req.file.originalname,
        }
      : null,
  };
}
