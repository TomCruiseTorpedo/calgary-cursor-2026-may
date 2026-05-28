import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import fs from "node:fs/promises";
import path from "node:path";
import { app } from "../server.js";
import { getRequestsDir } from "../lib/requests-store.js";

const TEST_DIR = path.join(process.cwd(), ".spec-workflow", "specs", "requests");

describe("API /api/requests", () => {
  let createdId;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterAll(async () => {
    if (createdId) {
      try {
        await fs.unlink(path.join(getRequestsDir(), `${createdId}.md`));
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
    expect(res.body.cursorCopy).toContain(createdId);
    expect(res.body.issueDraft).toContain("Done when");
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
});
