/**
 * Turn messy stakeholder text into a minified, AI-native PRD → ADR shape.
 * Rule-based (no API key required). Optional LLM polish via refineWithLlm().
 */

const TYPO_MAP = new Map([
  ["teh", "the"],
  ["adn", "and"],
  ["fro", "for"],
  ["exportt", "export"],
  ["exprot", "export"],
  ["dashbord", "dashboard"],
  ["dashbaord", "dashboard"],
  ["custmer", "customer"],
  ["custormer", "customer"],
  ["pasword", "password"],
  ["passowrd", "password"],
  ["logn", "login"],
  ["signin", "sign-in"],
  ["quater", "quarter"],
  ["becuase", "because"],
  ["wiht", "with"],
  ["taht", "that"],
  ["somethign", "something"],
  ["feautre", "feature"],
  ["buton", "button"],
  ["buttton", "button"],
]);

const VAGUE_PATTERNS = [
  /\bjust\b/i,
  /\bmaybe\b/i,
  /\bsort of\b/i,
  /\bkind of\b/i,
  /\bsomething\b/i,
  /\bstuff\b/i,
  /\bthing\b/i,
  /\beasier\b/i,
  /\bbetter\b/i,
  /\basap\b/i,
  /\bsoon\b/i,
  /\betc\.?\b/i,
];

const INFORMAL_TERMS = [
  { pattern: /\bthe app\b/gi, note: "Confirm which product surface (web, mobile, admin)." },
  { pattern: /\bthe system\b/gi, note: "Confirm which system or service boundary." },
  { pattern: /\bthe page\b/gi, note: "Confirm URL/route or screen name." },
  { pattern: /\bapi\b/gi, note: "Clarify public API vs internal endpoint vs integration." },
  { pattern: /\bdb\b/gi, note: "Clarify database vs datastore vs third-party." },
];

/**
 * @param {string} text
 * @returns {string}
 */
export function cleanText(text) {
  if (!text) return "";
  let s = text.normalize("NFKC").replace(/\s+/g, " ").trim();
  const words = s.split(" ");
  const fixed = words.map((w) => {
    const lower = w.toLowerCase().replace(/[.,!?;:]+$/, "");
    const punct = w.slice(lower.length);
    if (TYPO_MAP.has(lower)) {
      const rep = TYPO_MAP.get(lower);
      return w[0] === w[0].toUpperCase()
        ? rep.charAt(0).toUpperCase() + rep.slice(1) + punct
        : rep + punct;
    }
    return w;
  });
  s = fixed.join(" ");
  if (s.length > 0) {
    s = s.charAt(0).toUpperCase() + s.slice(1);
  }
  return s;
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export function detectVagueness(text) {
  const flags = [];
  for (const re of VAGUE_PATTERNS) {
    if (re.test(text)) flags.push(`Vague phrasing detected (${re.source})`);
  }
  return [...new Set(flags)];
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export function detectTerminologyGaps(text) {
  const notes = [];
  for (const { pattern, note } of INFORMAL_TERMS) {
    if (pattern.test(text)) notes.push(note);
  }
  return [...new Set(notes)];
}

/**
 * One-line minified goal from messy wish text.
 * @param {string} wish
 */
export function minifyGoal(wish) {
  const cleaned = cleanText(wish);
  const stripped = cleaned
    .replace(/\b(please|can you|we need|i need|i want|they want)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentence = stripped.split(/[.!?]/)[0]?.trim() || stripped;
  if (sentence.length <= 120) return sentence;
  return `${sentence.slice(0, 117).trim()}…`;
}

/**
 * @param {object} raw
 * @param {string} raw.wish
 * @param {string} raw.audience
 * @param {string} raw.frequency
 * @param {string} raw.success
 * @param {string} [raw.requesterLabel]
 * @param {string[]} [raw.clarify]
 * @param {string} [raw.clarifyNotes]
 */
export function normalizeRequest(raw) {
  const wish = cleanText(raw.wish || "");
  const success = cleanText(raw.success || "");
  const audience = (raw.audience || "").trim();
  const frequency = (raw.frequency || "").trim();
  const clarify = raw.clarify || [];
  const clarifyNotes = cleanText(raw.clarifyNotes || "");

  const vagueness = [
    ...detectVagueness(raw.wish || ""),
    ...detectVagueness(raw.success || ""),
    ...detectVagueness(clarifyNotes),
  ];
  const terminology = [
    ...detectTerminologyGaps(raw.wish || ""),
    ...detectTerminologyGaps(raw.success || ""),
  ];

  const goal = minifyGoal(wish);
  const constraints = clarify.length
    ? clarify.map((c) => `- ${c}`)
    : ["- (none flagged in intake)"];

  const openQuestions = [
    ...vagueness.map((v) => `- ${v} — tighten wording with requester.`),
    ...terminology.map((t) => `- ${t}`),
  ];
  if (openQuestions.length === 0) {
    openQuestions.push("- None auto-detected; confirm edge cases before build.");
  }

  const prd = {
    goal,
    user: audience || "TBD",
    frequency: frequency || "TBD",
    success: success || "TBD",
    constraints,
  };

  const adr = {
    context: `Stakeholder ask (normalized): ${goal}`,
    decision:
      "Proceed with implementation only after scope in **Out of scope** is agreed; use minified PRD as source of truth.",
    inScope: [
      `- Deliver: ${goal}`,
      `- Measurable outcome: ${success}`,
      `- Primary users: ${audience}`,
    ],
    outOfScope: [
      "- Undocumented integrations unless added to PRD",
      "- Performance/security hardening beyond success criteria unless listed in constraints",
    ],
    assumptions: openQuestions,
  };

  const cursorPrompt = buildCursorPrompt({ prd, adr, id: raw.id });

  return {
    cleaned: { wish, success, clarifyNotes },
    prd,
    adr,
    cursorPrompt,
    warnings: [...vagueness, ...terminology],
  };
}

function buildCursorPrompt({ prd, adr }) {
  return [
    "You are implementing a scoped change from a stakeholder request.",
    "",
    "PRD:",
    `- goal: ${prd.goal}`,
    `- user: ${prd.user}`,
    `- frequency: ${prd.frequency}`,
    `- success: ${prd.success}`,
    `- constraints:`,
    ...prd.constraints,
    "",
    "ADR:",
    `- context: ${adr.context}`,
    `- decision: ${adr.decision}`,
    `- in_scope:`,
    ...adr.inScope,
    `- out_of_scope:`,
    ...adr.outOfScope,
    `- open_questions:`,
    ...adr.assumptions,
    "",
    "Rules: do not expand scope beyond PRD; resolve open_questions before large refactors.",
  ].join("\n");
}

import {
  chatCompletion,
  isOpenRouterConfigured,
  parseJsonFromModelText,
} from "./openrouter-client.js";

/**
 * Optional LLM polish via OpenRouter (openrouter/free by default).
 * @param {ReturnType<typeof normalizeRequest>} baseline
 * @param {object} raw
 * @param {{ useLlm?: boolean }} [options]
 * @returns {Promise<{ normalized: object, modelUsed?: string } | null>}
 */
export async function refineWithLlm(baseline, raw, options = {}) {
  if (!options.useLlm) return null;
  if (!isOpenRouterConfigured()) return null;

  const system = `You normalize messy stakeholder software requests into minified, agent-ready specs.
Fix spelling and vague wording. Use precise product language. Output JSON only.`;

  const user = `Transform this intake into structured JSON.

{
  "goal": "one clear line",
  "success": "one testable acceptance sentence",
  "constraints": ["string"],
  "context": "one sentence for ADR context",
  "decision": "one sentence implementation decision",
  "in_scope": ["bullet"],
  "out_of_scope": ["bullet"],
  "open_questions": ["bullet for the builder to confirm"]
}

Raw wish: ${raw.wish}
Success (raw): ${raw.success}
Audience: ${raw.audience}
Frequency: ${raw.frequency}
Clarify flags: ${(raw.clarify || []).join("; ") || "none"}
Notes: ${raw.clarifyNotes || "none"}

Rule-based draft (for reference):
goal: ${baseline.prd.goal}
success: ${baseline.prd.success}`;

  try {
    const { content, modelUsed } = await chatCompletion({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      responseFormat: { type: "json_object" },
    });

    const parsed = parseJsonFromModelText(content);
    if (!parsed) return null;

    const constraints =
      Array.isArray(parsed.constraints) && parsed.constraints.length > 0
        ? parsed.constraints.map((c) => `- ${c}`)
        : baseline.prd.constraints;

    const inScope =
      Array.isArray(parsed.in_scope) && parsed.in_scope.length > 0
        ? parsed.in_scope.map((s) => `- ${s}`)
        : baseline.adr.inScope;

    const outOfScope =
      Array.isArray(parsed.out_of_scope) && parsed.out_of_scope.length > 0
        ? parsed.out_of_scope.map((s) => `- ${s}`)
        : baseline.adr.outOfScope;

    const assumptions =
      Array.isArray(parsed.open_questions) && parsed.open_questions.length > 0
        ? parsed.open_questions.map((q) => `- ${q}`)
        : baseline.adr.assumptions;

    const normalized = {
      ...baseline,
      prd: {
        ...baseline.prd,
        goal: parsed.goal || baseline.prd.goal,
        success: parsed.success || baseline.prd.success,
        constraints,
      },
      adr: {
        context: parsed.context || baseline.adr.context,
        decision: parsed.decision || baseline.adr.decision,
        inScope,
        outOfScope,
        assumptions,
      },
      refinedBy: "llm",
      modelUsed,
    };

    return { normalized, modelUsed };
  } catch (err) {
    console.error("OpenRouter refine failed:", err.message);
    return null;
  }
}
