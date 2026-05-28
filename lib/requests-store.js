import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseFrontmatter, serializeFrontmatter } from "./frontmatter.js";
import { buildRequestSpec } from "./spec-writer.js";
import { saveAttachment, getAttachmentMeta } from "./attachments.js";

const REQUESTS_DIR = path.join(
  process.cwd(),
  ".spec-workflow",
  "specs",
  "requests",
);

export function getRequestsDir() {
  return REQUESTS_DIR;
}

export async function ensureRequestsDir() {
  await fs.mkdir(REQUESTS_DIR, { recursive: true });
}

function specPath(id) {
  return path.join(REQUESTS_DIR, `${id}.md`);
}

export async function createRequest(payload) {
  await ensureRequestsDir();
  const id = randomUUID();
  const createdAt = new Date().toISOString();

  let attachment = null;
  if (payload.screenshot?.buffer) {
    attachment = await saveAttachment(id, {
      buffer: payload.screenshot.buffer,
      mimetype: payload.screenshot.mimetype,
      originalname: payload.screenshot.originalname,
    });
  }

  const { markdown, normalized, normalizedMode, llmModel } = await buildRequestSpec({
    id,
    createdAt,
    requesterLabel: payload.requesterLabel,
    wish: payload.wish,
    audience: payload.audience,
    frequency: payload.frequency,
    success: payload.success,
    clarify: payload.clarify,
    clarifyNotes: payload.clarifyNotes,
    useLlm: Boolean(payload.useLlm),
    attachment,
  });
  await fs.writeFile(specPath(id), markdown, "utf8");
  return {
    id,
    createdAt,
    status: "new",
    attachmentUrl: attachment?.urlPath || null,
    recap: {
      goal: normalized.prd.goal,
      success: normalized.prd.success,
      warnings: normalized.warnings,
      normalizedMode,
      llmModel,
      useLlm: Boolean(payload.useLlm),
      hasAttachment: Boolean(attachment),
    },
  };
}

function extractSummary(body) {
  const goalRow = body.match(/\*\*Goal\*\* \| (.+)/);
  if (goalRow) return goalRow[1].trim();
  const legacy = body.match(/## Summary\s*\n+([\s\S]*?)(?=\n## )/);
  if (legacy) return legacy[1].trim().split("\n")[0];
  return "";
}

/** Stable #1 = oldest request; higher numbers = newer. */
export function assignRequestNumbers(items) {
  const chronological = [...items].sort((a, b) => {
    const byDate = (a.createdAt || "").localeCompare(b.createdAt || "");
    if (byDate !== 0) return byDate;
    return (a.id || "").localeCompare(b.id || "");
  });
  const numberById = new Map();
  chronological.forEach((item, index) => {
    numberById.set(item.id, index + 1);
  });
  return items.map((item) => ({
    ...item,
    requestNumber: numberById.get(item.id) ?? 0,
  }));
}

async function loadRequestSummaries() {
  await ensureRequestsDir();
  const entries = await fs.readdir(REQUESTS_DIR);
  const files = entries.filter((f) => f.endsWith(".md"));
  const items = [];

  for (const file of files) {
    const id = file.replace(/\.md$/, "");
    const content = await fs.readFile(path.join(REQUESTS_DIR, file), "utf8");
    const { frontmatter, body } = parseFrontmatter(content);
    items.push({
      id: frontmatter.id || id,
      status: frontmatter.status || "new",
      requesterLabel: frontmatter.requesterLabel || "",
      createdAt: frontmatter.createdAt || "",
      summary: extractSummary(body),
    });
  }

  return items;
}

export async function listRequests() {
  const items = assignRequestNumbers(await loadRequestSummaries());
  items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return items;
}

export async function getRequest(id) {
  const file = specPath(id);
  let content;
  try {
    content = await fs.readFile(file, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
  const { frontmatter, body } = parseFrontmatter(content);
  const attachment = await getAttachmentMeta(id);
  const resolvedId = frontmatter.id || id;
  const numbered = assignRequestNumbers(await loadRequestSummaries());
  const listMeta = numbered.find((item) => item.id === resolvedId);
  return {
    id: resolvedId,
    status: frontmatter.status || "new",
    requesterLabel: frontmatter.requesterLabel || "",
    createdAt: frontmatter.createdAt || "",
    requestNumber: listMeta?.requestNumber ?? null,
    normalized: frontmatter.normalized || "rules",
    attachmentUrl: attachment?.urlPath || null,
    content,
    body,
    frontmatter,
  };
}

const ALLOWED_STATUS = new Set(["new", "in-cursor", "done"]);

export async function updateRequestStatus(id, status) {
  if (!ALLOWED_STATUS.has(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  const existing = await getRequest(id);
  if (!existing) return null;

  const frontmatter = { ...existing.frontmatter, status };
  const content = serializeFrontmatter(frontmatter) + existing.body;
  await fs.writeFile(specPath(id), content, "utf8");
  return { id, status };
}

export function cursorCopyText(request) {
  const relPath = `.spec-workflow/specs/requests/${request.id}.md`;
  const blockMatch = request.body.match(
    /## Cursor prompt \(minified\)\s*\n+```text\n([\s\S]*?)```/,
  );
  if (blockMatch) {
    let text = `${blockMatch[1].trim()}

---
Full spec: ${relPath}
Follow AGENTS.md.`;
    const att = request.body.match(
      /## Attachment \(screenshot\)[\s\S]*?\*\*View in app:\*\* (.+)/,
    );
    if (att) {
      text += `\n\nScreenshot: ${att[1].trim()}`;
    }
    return text;
  }
  return `Implement the feature described in ${relPath}.

Follow AGENTS.md conventions.

---

${request.content}`;
}

export function issueDraftFromBody(body) {
  const match = body.match(/## GitHub issue draft\s*\n+([\s\S]*)$/);
  return match ? match[1].trim() : "";
}
