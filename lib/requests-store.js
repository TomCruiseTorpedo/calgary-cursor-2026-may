import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseFrontmatter, serializeFrontmatter } from "./frontmatter.js";
import { buildRequestSpec } from "./spec-writer.js";

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
  const content = buildRequestSpec({
    id,
    createdAt,
    requesterLabel: payload.requesterLabel,
    wish: payload.wish,
    audience: payload.audience,
    frequency: payload.frequency,
    success: payload.success,
    clarify: payload.clarify,
    clarifyNotes: payload.clarifyNotes,
  });
  await fs.writeFile(specPath(id), content, "utf8");
  return { id, createdAt, status: "new" };
}

export async function listRequests() {
  await ensureRequestsDir();
  const entries = await fs.readdir(REQUESTS_DIR);
  const files = entries.filter((f) => f.endsWith(".md"));
  const items = [];

  for (const file of files) {
    const id = file.replace(/\.md$/, "");
    const content = await fs.readFile(path.join(REQUESTS_DIR, file), "utf8");
    const { frontmatter, body } = parseFrontmatter(content);
    const summaryMatch = body.match(/## Summary\s*\n+([\s\S]*?)(?=\n## )/);
    items.push({
      id: frontmatter.id || id,
      status: frontmatter.status || "new",
      requesterLabel: frontmatter.requesterLabel || "",
      createdAt: frontmatter.createdAt || "",
      summary: summaryMatch ? summaryMatch[1].trim().split("\n")[0] : "",
    });
  }

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
  return {
    id: frontmatter.id || id,
    status: frontmatter.status || "new",
    requesterLabel: frontmatter.requesterLabel || "",
    createdAt: frontmatter.createdAt || "",
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
  return `Implement the feature described in ${relPath}.

Follow AGENTS.md conventions.

---

${request.content}`;
}

export function issueDraftFromBody(body) {
  const match = body.match(/## GitHub issue draft\s*\n+([\s\S]*)$/);
  return match ? match[1].trim() : "";
}
