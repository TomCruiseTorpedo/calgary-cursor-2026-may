import { describe, it, expect, afterEach } from "vitest";
import {
  getOpenRouterConfig,
  isOpenRouterConfigured,
  parseJsonFromModelText,
} from "../lib/openrouter-client.js";

describe("openrouter-client", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("reports availability from env", () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(isOpenRouterConfigured()).toBe(false);
    process.env.OPENROUTER_API_KEY = "test-key";
    expect(isOpenRouterConfigured()).toBe(true);
  });

  it("defaults model to openrouter/free", () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    delete process.env.OPENROUTER_MODEL;
    expect(getOpenRouterConfig().model).toBe("openrouter/free");
  });

  it("parses JSON from fenced model output", () => {
    const parsed = parseJsonFromModelText(
      '```json\n{"goal":"Export CSV","success":"Done"}\n```',
    );
    expect(parsed.goal).toBe("Export CSV");
  });
});
