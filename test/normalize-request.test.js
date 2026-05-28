import { describe, it, expect } from "vitest";
import {
  cleanText,
  minifyGoal,
  normalizeRequest,
} from "../lib/normalize-request.js";

describe("normalizeRequest", () => {
  it("fixes common typos and minifies goal", () => {
    const result = normalizeRequest({
      wish: "sales need to exprot dashbord to csv asap pls",
      audience: "Internal team (e.g. sales, support)",
      frequency: "Weekly",
      success: "rep can download csv in under a min",
      clarify: ["Has a deadline"],
    });

    expect(result.cleaned.wish).toMatch(/export/i);
    expect(result.cleaned.wish).toMatch(/dashboard/i);
    expect(result.prd.goal.length).toBeLessThan(80);
    expect(result.prd.success).toMatch(/csv/i);
    expect(result.cursorPrompt).toContain("PRD:");
    expect(result.cursorPrompt).toContain("ADR:");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("produces ADR open questions for vague phrasing", () => {
    const result = normalizeRequest({
      wish: "just make the thing easier somehow",
      audience: "Customers / end users",
      frequency: "Daily",
      success: "it works better",
    });
    expect(result.adr.assumptions.some((a) => /Vague/i.test(a))).toBe(true);
  });
});

describe("cleanText", () => {
  it("normalizes whitespace and typos", () => {
    expect(cleanText("  teh   custmer   pasword  ")).toBe("The customer password");
  });
});

describe("minifyGoal", () => {
  it("strips filler phrases", () => {
    const g = minifyGoal("Can you please add CSV export for the dashboard");
    expect(g.toLowerCase()).toContain("csv");
    expect(g.toLowerCase()).not.toContain("can you");
  });
});
