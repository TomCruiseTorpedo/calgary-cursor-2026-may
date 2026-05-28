# Plain Jane's Task Ask

*Plain English in.*

*Builder-ready spec out.*

This repo hosts **Plain Jane's Task Ask** for the Calgary Cursor May 2026 buildathon (`calgary-cursor-2026-may`).

## What it does

Stakeholders type **messy human input** — spelling mistakes, vague phrasing, wrong or informal terminology. The app **normalizes** that into an **AI-native, minified spec**: a scoped **PRD** (what / who / success) and **ADR** (decisions, in/out of scope, open questions), plus a **Cursor prompt** block ready to paste.

- **Shareable request form** (`/request`) — plain English only; no GitHub account.
- **Normalization pipeline** (`lib/normalize-request.js`) — typo cleanup, goal minification, vagueness and terminology flags; optional **Polish with AI** toggle on `/request` uses OpenRouter **`openrouter/free`** via `lib/openrouter-client.js`.
- **Spec on disk** — `.spec-workflow/specs/requests/<id>.md` with stable PRD → ADR headings and verbatim raw intake preserved for audit.
- **Developer Inbox** (`/inbox`) — **Open** and **Resolved** sidebar cards, stable request numbers (`#1`, `#2`, …), preview spec, optional screenshot, **Copy for Cursor**, GitHub issue draft, status tracking.
- **Screenshot attachment** (optional on clarify step) — PNG/JPEG/WebP/GIF saved with the spec and previewed in the inbox.

## Who it's for

| Role | Surface |
|------|---------|
| Requester (PM, client, founder, designer) | `/request` |
| Builder (developer using Cursor) | `/inbox` |

This is a **software delivery** workflow tool, not a consumer life app.

## Problem (personal)

As a developer, I lose time turning vague, messy asks from PMs, clients, and founders into something Cursor can implement. The pain is **before code**: typos and fuzzy language hide real scope, success criteria are missing, and context is stuck in chat or email instead of a **minified PRD → ADR** an agent can execute.

## Fit with the event prompt

The meetup asked for a project that solves an **everyday pain point** with **AI-native** tooling. Plain Jane's Task Ask converts everyday messy language into a **spec-shaped, agent-ready brief** (PRD + ADR + minified Cursor prompt) so builders can implement in Cursor without making stakeholders learn GitHub.

## Quick start

```bash
npm install
npm test
npm start
```

- Stakeholder intake: http://localhost:3000/request  
- Developer Inbox: http://localhost:3000/inbox  

## Verify the core loop

1. Open `/request`, complete all three steps, clarify questions, and optionally attach a screenshot.
2. Confirm a new file under `.spec-workflow/specs/requests/`.
3. Open `/inbox` — the request appears in the list.
4. Open the spec file — confirm **PRD (minified)**, **ADR**, and **Cursor prompt (minified)** sections exist; raw intake is preserved below.
5. Click **Copy for Cursor** — clipboard contains the minified PRD/ADR prompt (not just raw stakeholder text).
6. Mark status **In Cursor** then **Done**.

Try messy input on purpose, e.g. `sales need to exprot dashbord to csv asap` — the saved spec should show cleaned wording and scoped open questions.

## Demo URL

*(Add Vercel URL after deploy.)*

## For AI coding assistants

**Start here:** [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md).

### Purpose

Upstream spec handoff: stakeholder intake → markdown brief on disk → Developer Inbox → Cursor implementation.

### File map

| Path | Role |
|------|------|
| `server.js` | Express server, API, static routes |
| `lib/normalize-request.js` | Messy text → minified PRD + ADR + Cursor prompt (rules; optional LLM) |
| `lib/spec-writer.js` | Assembles full markdown spec from normalized output |
| `lib/requests-store.js` | Read/write/list specs; stable `requestNumber`; attachments |
| `lib/attachments.js` | Screenshot storage under `requests/attachments/` |
| `lib/parse-create-payload.js` | JSON + multipart body parsing for `POST /api/requests` |
| `lib/upload-middleware.js` | Multer middleware for optional screenshot upload |
| `lib/frontmatter.js` | YAML frontmatter parse/serialize |
| `public/request/` | Stakeholder 3-step form |
| `public/inbox/` | Developer Inbox UI |
| `public/shared/` | Clay design tokens + shared CSS |
| `.spec-workflow/specs/pain-point.md` | Product problem statement |
| `.spec-workflow/specs/ui-and-design.md` | UI surfaces and copy rules |
| `DESIGN.md` | Clay UI tokens (`npx getdesign@latest add clay`) |
| `test/` | Vitest tests for spec writer + API |

### API routes

| Method | Path | Body / notes |
|--------|------|----------------|
| `GET` | `/api/config` | `{ llmAvailable, model, provider }` — drives AI toggle on `/request` |
| `POST` | `/api/requests` | JSON **or** `multipart/form-data` (optional `screenshot` file + same fields) |
| `GET` | `/api/requests` | List metadata (`requestNumber`, `summary`, `status`, …) for inbox |
| `GET` | `/api/requests/:id` | Full spec + `cursorCopy` + `issueDraft` + `requestNumber` + `attachmentUrl` |
| `GET` | `/api/requests/:id/attachment` | Screenshot bytes (when uploaded) |
| `PATCH` | `/api/requests/:id` | `{ status }` — `new` \| `in-cursor` \| `done` |

### Spec file schema

Each request is one markdown file. **Preserve these headings** when editing:

```yaml
---
id: <uuid>
status: new | in-cursor | done
requesterLabel: <name + role, required>
createdAt: <ISO-8601>
normalized: rules | llm+rules | rules (llm-unavailable)
---
```

```markdown
## Cursor prompt (minified)
## PRD (minified)
## ADR
## Attachment (screenshot)   # when a file was uploaded
### Context
### Decision
### In scope
### Out of scope
### Open questions
## Raw intake (verbatim)
## GitHub issue draft
```

Implement from **Cursor prompt** + **PRD** + **ADR**; use **Raw intake** only when something ambiguous needs the original wording.

### Suggested agent prompt

```text
Implement the feature described in .spec-workflow/specs/requests/<id>.md.
Follow AGENTS.md and DESIGN.md. Do not commit .cursor/ or secrets.
```

### Out of scope for agents

- Committing `.cursor/` (local ECC install)
- `docs/private/` (local-only, gitignored)
- GitHub Actions / CI automation unless explicitly requested

## Design system

UI uses the **Clay** palette from [getdesign.md](https://getdesign.md/clay/design-md). Tokens: [`DESIGN.md`](DESIGN.md).

## ECC / Cursor setup

Local ECC is gitignored. Reinstall from [docs/ECC-SETUP.md](docs/ECC-SETUP.md). Memory path: `~/.cursor/ecc-calgary-2026-may`.

## Environment variables

See [`.env.example`](.env.example). **No secrets required** for the core loop (rules-only). Set `OPENROUTER_API_KEY` to enable the **Polish with AI** toggle (`OPENROUTER_MODEL=openrouter/free` by default).

## Repository metadata

```yaml
project: plain-janes-task-ask
stack: node express vitest
meetup: cursor-calgary-may-2026
core_loop: request-form -> spec-md -> inbox -> copy-for-cursor
```

## License

Apache License 2.0 — see [LICENSE](LICENSE).
