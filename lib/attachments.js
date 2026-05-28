import fs from "node:fs/promises";
import path from "node:path";

const ATTACHMENTS_DIR = path.join(
  process.cwd(),
  ".spec-workflow",
  "specs",
  "requests",
  "attachments",
);

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const EXT_BY_MIME = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export function isAllowedImageMime(mime) {
  return Boolean(EXT_BY_MIME[mime]);
}

export function getAttachmentsDir() {
  return ATTACHMENTS_DIR;
}

export async function ensureAttachmentsDir() {
  await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
}

/**
 * @param {string} requestId
 * @param {{ buffer: Buffer, mimetype: string, originalname?: string }} file
 */
export async function saveAttachment(requestId, file) {
  if (!isAllowedImageMime(file.mimetype)) {
    throw new Error("Only PNG, JPEG, WebP, and GIF images are allowed");
  }
  if (file.buffer.length > MAX_ATTACHMENT_BYTES) {
    throw new Error("Image must be 5 MB or smaller");
  }

  await ensureAttachmentsDir();
  const ext = EXT_BY_MIME[file.mimetype];
  const filename = `${requestId}${ext}`;
  const absolutePath = path.join(ATTACHMENTS_DIR, filename);
  await fs.writeFile(absolutePath, file.buffer);

  return {
    filename,
    mimeType: file.mimetype,
    size: file.buffer.length,
    specPath: `attachments/${filename}`,
    urlPath: `/api/requests/${requestId}/attachment`,
  };
}

/**
 * @param {string} requestId
 */
export async function getAttachmentMeta(requestId) {
  await ensureAttachmentsDir();
  const entries = await fs.readdir(ATTACHMENTS_DIR);
  const match = entries.find((name) => name.startsWith(`${requestId}.`));
  if (!match) return null;

  const ext = path.extname(match).toLowerCase();
  const mimeByExt = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };

  return {
    filename: match,
    mimeType: mimeByExt[ext] || "application/octet-stream",
    specPath: `attachments/${match}`,
    urlPath: `/api/requests/${requestId}/attachment`,
  };
}

/**
 * @param {string} requestId
 */
export async function readAttachmentFile(requestId) {
  const meta = await getAttachmentMeta(requestId);
  if (!meta) return null;
  const absolutePath = path.join(ATTACHMENTS_DIR, meta.filename);
  const buffer = await fs.readFile(absolutePath);
  return { ...meta, buffer, absolutePath };
}
