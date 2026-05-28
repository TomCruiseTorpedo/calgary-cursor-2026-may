import { serializeFrontmatter } from "./frontmatter.js";
import { normalizeRequest, refineWithLlm } from "./normalize-request.js";

/**
 * @param {object} input
 * @param {string} input.id
 * @param {string} [input.requesterLabel]
 * @param {string} input.createdAt
 * @param {string} input.wish
 * @param {string} input.audience
 * @param {string} input.frequency
 * @param {string} input.success
 * @param {string[]} [input.clarify]
 * @param {string} [input.clarifyNotes]
 */
export async function buildRequestSpec(input) {
  let normalized = normalizeRequest(input);
  let normalizedMode = "rules";
  let llmModel;

  if (input.useLlm) {
    const llmResult = await refineWithLlm(normalized, input, { useLlm: true });
    if (llmResult?.normalized) {
      normalized = {
        ...llmResult.normalized,
        cursorPrompt: buildCursorPromptFromParts(
          llmResult.normalized.prd,
          llmResult.normalized.adr,
        ),
      };
      normalizedMode = "llm+rules";
      llmModel = llmResult.modelUsed;
    } else if (input.useLlm) {
      normalizedMode = "rules (llm-unavailable)";
    }
  }

  const frontmatter = {
    id: input.id,
    status: "new",
    requesterLabel: input.requesterLabel || "",
    createdAt: input.createdAt,
    normalized: normalizedMode,
    ...(llmModel ? { llmModel } : {}),
    ...(input.attachment ? { attachment: input.attachment.specPath } : {}),
  };

  const issueDraft = buildIssueDraft(input, normalized);
  const body = formatSpecBody(input, normalized, issueDraft);

  return {
    markdown: serializeFrontmatter(frontmatter) + body,
    normalized,
    normalizedMode,
    llmModel,
  };
}

/** @param {import('./normalize-request.js').normalizeRequest extends Function ? ReturnType<import('./normalize-request.js').normalizeRequest> : never} normalized */
function formatSpecBody(input, normalized, issueDraft) {
  const { prd, adr, cleaned, cursorPrompt } = normalized;

  const clarifyList =
    input.clarify?.length > 0
      ? input.clarify.map((c) => `- ${c}`).join("\n")
      : "- (none selected)";

  return `## Cursor prompt (minified)

\`\`\`text
${cursorPrompt}
\`\`\`

## PRD (minified)

| Field | Value |
|-------|--------|
| **Goal** | ${prd.goal} |
| **User** | ${prd.user} |
| **Frequency** | ${prd.frequency} |
| **Success** | ${prd.success} |

**Constraints**

${prd.constraints.join("\n")}

## ADR

### Context

${adr.context}

### Decision

${adr.decision}

### In scope

${adr.inScope.join("\n")}

### Out of scope

${adr.outOfScope.join("\n")}

### Open questions

${adr.assumptions.join("\n")}

${formatAttachmentSection(input)}

## Raw intake (verbatim)

Stakeholder text is preserved for audit; implement from **PRD** and **ADR** above.

### Wish (as submitted)

${input.wish.trim()}

### Success (as submitted)

${input.success.trim()}

### Cleaned (auto)

- Wish: ${cleaned.wish}
- Success: ${cleaned.success}
${cleaned.clarifyNotes ? `- Notes: ${cleaned.clarifyNotes}` : ""}

### Audience & frequency

- ${input.audience}
- ${input.frequency}

### Clarify selections

${clarifyList}

${input.clarifyNotes ? `### Clarify notes (as submitted)\n\n${input.clarifyNotes.trim()}\n` : ""}

## GitHub issue draft

${issueDraft}
`;
}

function formatAttachmentSection(input) {
  if (!input.attachment) return "";
  return `## Attachment (screenshot)

Stakeholder provided a reference image.

- **View in app:** ${input.attachment.urlPath}
- **File:** \`.spec-workflow/specs/requests/${input.attachment.specPath}\`
`;
}

function buildCursorPromptFromParts(prd, adr) {
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

function buildIssueDraft(input, normalized) {
  const title =
    normalized.prd.goal.length > 72
      ? `${normalized.prd.goal.slice(0, 69)}…`
      : normalized.prd.goal;

  return `**Title:** ${title}

**Goal (normalized)**

${normalized.prd.goal}

**Success**

${normalized.prd.success}

**Users & cadence**

- ${normalized.prd.user}
- ${normalized.prd.frequency}

**Open questions**

${normalized.adr.assumptions.join("\n")}

**Spec file**

\`.spec-workflow/specs/requests/${input.id}.md\` — start from **Cursor prompt (minified)**.
`;
}
