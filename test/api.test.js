import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import fs from "node:fs/promises";
import path from "node:path";
import { app } from "../server.js";
import { getRequestsDir } from "../lib/requests-store.js";

const TEST_DIR = path.join(process.cwd(), ".spec-workflow", "specs", "requests");

describe("API /api/config", () => {
  it("returns openrouter config shape", async () => {
    const res = await request(app).get("/api/config");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("llmAvailable");
    expect(res.body.model).toBeTruthy();
  });
});

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("API /api/requests", () => {
  let createdId;
  let attachmentId;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterAll(async () => {
    for (const id of [createdId, attachmentId].filter(Boolean)) {
      try {
        await fs.unlink(path.join(getRequestsDir(), `${id}.md`));
      } catch {
        /* ignore */
      }
      try {
        await fs.unlink(
          path.join(getRequestsDir(), "attachments", `${id}.png`),
        );
      } catch {
        /* ignore */
      }
    }
  });

  it("POST creates a spec file", async () => {
    const res = await request(app)
      .post("/api/requests")
      .send({
        wish: "Password reset without calling support",
        audience: "Customers / end users",
        frequency: "Daily",
        success: "Users complete reset from email link",
        requesterLabel: "Client PM",
        clarify: ["Touches customer data"],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    createdId = res.body.id;

    const file = await fs.readFile(
      path.join(getRequestsDir(), `${createdId}.md`),
      "utf8",
    );
    expect(file).toContain("Password reset");
    expect(file).toContain("status: new");
    expect(file).toContain("## PRD (minified)");
    expect(file).toContain("## Cursor prompt (minified)");
  });

  it("GET lists requests including created", async () => {
    const res = await request(app).get("/api/requests");
    expect(res.status).toBe(200);
    const found = res.body.find((r) => r.id === createdId);
    expect(found).toBeTruthy();
    expect(found.summary).toContain("Password reset");
  });

  it("GET by id returns cursor copy", async () => {
    const res = await request(app).get(`/api/requests/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.cursorCopy).toContain("PRD:");
    expect(res.body.cursorCopy).toContain(createdId);
    expect(res.body.issueDraft).toContain("Success");
  });

  it("PATCH updates status", async () => {
    const res = await request(app)
      .patch(`/api/requests/${createdId}`)
      .send({ status: "in-cursor" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("in-cursor");

    const file = await fs.readFile(
      path.join(getRequestsDir(), `${createdId}.md`),
      "utf8",
    );
    expect(file).toContain("status: in-cursor");
  });

  it("POST rejects missing fields", async () => {
    const res = await request(app).post("/api/requests").send({ wish: "only" });
    expect(res.status).toBe(400);
  });

  it("POST multipart saves screenshot attachment", async () => {
    const res = await request(app)
      .post("/api/requests")
      .field("wish", "Show error banner on failed login")
      .field("requesterLabel", "QA Lead")
      .field("audience", "Internal staff / team")
      .field("frequency", "Weekly")
      .field("success", "Banner shows within 2 seconds of bad password")
      .field("clarify", JSON.stringify(["Touches customer data"]))
      .attach("screenshot", PNG_1X1, {
        filename: "login-error.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(201);
    attachmentId = res.body.id;
    expect(res.body.attachmentUrl).toBe(
      `/api/requests/${attachmentId}/attachment`,
    );
    expect(res.body.recap.hasAttachment).toBe(true);

    const file = await fs.readFile(
      path.join(getRequestsDir(), `${attachmentId}.md`),
      "utf8",
    );
    expect(file).toContain("## Attachment (screenshot)");

    const attRes = await request(app).get(res.body.attachmentUrl);
    expect(attRes.status).toBe(200);
    expect(attRes.headers["content-type"]).toMatch(/image\/png/);
  });
});
