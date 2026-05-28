import { serializeFrontmatter } from "./frontmatter.js";

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
export function buildRequestSpec(input) {
  const frontmatter = {
    id: input.id,
    status: "new",
    requesterLabel: input.requesterLabel || "",
    createdAt: input.createdAt,
  };

  const clarifyList =
    input.clarify?.length > 0
      ? input.clarify.map((c) => `- ${c}`).join("\n")
      : "- (none selected)";

  const issueDraft = buildIssueDraft(input);

  const body = `## Summary

${input.wish.trim()}

## Context

- **Who it's for:** ${input.audience}
- **How often:** ${input.frequency}
${input.requesterLabel ? `- **From:** ${input.requesterLabel}` : ""}

## Success criteria

${input.success.trim()}

## Out of scope

- Not defined in intake — builder to confirm with requester if needed.

## Raw answers

### What should be easier?

${input.wish.trim()}

### Who is it for & when?

- Audience: ${input.audience}
- Frequency: ${input.frequency}

### How will you know it's working?

${input.success.trim()}

### Clarify selections

${clarifyList}

${input.clarifyNotes ? `### Clarify notes\n\n${input.clarifyNotes.trim()}\n` : ""}

## GitHub issue draft

${issueDraft}
`;

  return serializeFrontmatter(frontmatter) + body;
}

function buildIssueDraft(input) {
  const title =
    input.wish.length > 72 ? `${input.wish.slice(0, 69)}...` : input.wish;

  return `**Title:** ${title}

**Problem / request**

${input.wish.trim()}

**Users & context**

- Audience: ${input.audience}
- Frequency: ${input.frequency}

**Done when**

${input.success.trim()}

**Spec file**

\`.spec-workflow/specs/requests/${input.id}.md\`
`;
}
