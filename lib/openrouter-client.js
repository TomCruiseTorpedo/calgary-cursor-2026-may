/**
 * OpenRouter chat completions — free router by default (openrouter/free).
 * @see https://openrouter.ai/docs/guides/routing/routers/free-router
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export function isOpenRouterConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export function getOpenRouterModel() {
  return process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";
}

export function getOpenRouterConfig() {
  return {
    llmAvailable: isOpenRouterConfigured(),
    model: getOpenRouterModel(),
    provider: "openrouter",
  };
}

/**
 * @param {object} options
 * @param {Array<{role: string, content: string}>} options.messages
 * @param {string} [options.model]
 * @param {object} [options.responseFormat] OpenAI-style response_format
 * @param {number} [options.temperature]
 */
export async function chatCompletion({
  messages,
  model = getOpenRouterModel(),
  responseFormat,
  temperature = 0.2,
}) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const siteUrl =
    process.env.OPENROUTER_SITE_URL?.trim() || "http://localhost:3000";
  const appName =
    process.env.OPENROUTER_APP_NAME?.trim() || "Plain Jane's Task Ask";

  const body = {
    model,
    messages,
    temperature,
  };

  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": siteUrl,
      "X-Title": appName,
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`OpenRouter returned non-JSON (${res.status})`);
  }

  if (!res.ok) {
    const msg =
      data?.error?.message || data?.error || `OpenRouter error ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  const modelUsed = data.model || model;

  return { content, modelUsed, raw: data };
}

/**
 * @param {string} text
 * @returns {object | null}
 */
export function parseJsonFromModelText(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text.trim();
  const jsonMatch = candidate.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}
