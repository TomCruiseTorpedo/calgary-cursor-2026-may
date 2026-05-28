import { describe, it, expect } from "vitest";
import { buildRequestSpec } from "../lib/spec-writer.js";
import { parseFrontmatter } from "../lib/frontmatter.js";

describe("buildRequestSpec", () => {
  it("writes frontmatter and required headings", () => {
    const md = buildRequestSpec({
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

    const { frontmatter, body } = parseFrontmatter(md);
    expect(frontmatter.id).toBe("test-id");
    expect(frontmatter.status).toBe("new");
    expect(frontmatter.requesterLabel).toBe("Alex");

    expect(body).toContain("## Summary");
    expect(body).toContain("Export dashboard to CSV");
    expect(body).toContain("## Success criteria");
    expect(body).toContain("## GitHub issue draft");
    expect(body).toContain("Has a deadline");
    expect(body).toContain("Before Q2 close");
  });
});
