import { describe, it, expect } from "vitest";
import { buildRequestSpec } from "../lib/spec-writer.js";
import { parseFrontmatter } from "../lib/frontmatter.js";

describe("buildRequestSpec", () => {
  it("writes PRD, ADR, and minified cursor prompt", async () => {
    const { markdown } = await buildRequestSpec({
      id: "test-id",
      createdAt: "2026-05-28T12:00:00.000Z",
      requesterLabel: "Alex",
      wish: "Export dashboard to CSV",
      audience: "Internal team (e.g. sales, support)",
      frequency: "Weekly",
      success: "Sales can download CSV in under a minute",
      clarify: ["Has a deadline"],
      clarifyNotes: "Before Q2 close",
    });

    const { frontmatter, body } = parseFrontmatter(markdown);
    expect(frontmatter.id).toBe("test-id");
    expect(frontmatter.normalized).toMatch(/rules|llm/);

    expect(body).toContain("## Cursor prompt (minified)");
    expect(body).toContain("## PRD (minified)");
    expect(body).toContain("## ADR");
    expect(body).toContain("### Open questions");
    expect(body).toContain("## Raw intake (verbatim)");
    expect(body).toContain("## GitHub issue draft");
    expect(body).toContain("**Goal** |");
    expect(body).toContain("Has a deadline");
  });
});
