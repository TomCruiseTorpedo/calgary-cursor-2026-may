# Plain Jane's Task Ask

*Plain English in. Builder-ready spec out.*

This repo hosts **Plain Jane's Task Ask** for the Calgary Cursor May 2026 buildathon (`calgary-cursor-2026-may`).

## What it does

- **Shareable request form** — PMs, clients, and founders describe what they need in plain English (no GitHub account).
- **Structured spec on disk** — each request becomes `.spec-workflow/specs/requests/<id>.md` with headings agents can follow.
- **Developer inbox** — list requests, preview markdown, **Copy for Cursor**, optional GitHub issue draft, track status.

## Who it's for

| Role | Surface |
|------|---------|
| Requester (PM, client, founder, designer) | `/request` |
| Builder (developer using Cursor) | `/inbox` |

This is a **software delivery** workflow tool, not a consumer life app.

## Problem (personal)

As a developer, I lose time turning vague asks from PMs, clients, and founders into something Cursor can implement. The pain is **before code**: unclear scope, missing success criteria, and context stuck in chat or email.

## Fit with the event prompt

The meetup asked for a project that solves an **everyday pain point** with AI-native tooling. Plain Jane's Task Ask targets **upstream spec handoff** — stakeholders write plain English; the repo stores a builder-ready markdown brief and a dev inbox so Cursor can implement without making non-developers learn GitHub.

## Quick start

```bash
npm install
npm test
npm start
```

- Stakeholder intake: http://localhost:3000/request  
- Developer inbox: http://localhost:3000/inbox  

## Verify the core loop

1. Open `/request`, complete all three steps and clarify questions.
2. Confirm a new file under `.spec-workflow/specs/requests/`.
3. Open `/inbox` — the request appears in the list.
4. Click **Copy for Cursor** — clipboard contains the spec path and body.
5. Mark status **In Cursor** then **Done**.

## Demo URL

*(Add Vercel URL after deploy.)*

## For AI coding assistants

**Start here:** [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md).

### Purpose

Upstream spec handoff: stakeholder intake → markdown brief on disk → developer inbox → Cursor implementation.

### File map

| Path | Role |
|------|------|
| `server.js` | Express server, API, static routes |
| `lib/spec-writer.js` | Builds request markdown from form JSON |
| `lib/requests-store.js` | Read/write/list specs under `.spec-workflow/specs/requests/` |
| `lib/frontmatter.js` | YAML frontmatter parse/serialize |
| `public/request/` | Stakeholder 3-step form |
| `public/inbox/` | Developer inbox UI |
| `public/shared/` | Clay design tokens + shared CSS |
| `.spec-workflow/specs/pain-point.md` | Product problem statement |
| `.spec-workflow/specs/ui-and-design.md` | UI surfaces and copy rules |
| `DESIGN.md` | Clay UI tokens (`npx getdesign@latest add clay`) |
| `test/` | Vitest tests for spec writer + API |

### API routes

| Method | Path | Body / notes |
|--------|------|----------------|
| `POST` | `/api/requests` | `{ wish, audience, frequency, success, requesterLabel?, clarify?, clarifyNotes? }` |
| `GET` | `/api/requests` | List metadata for inbox |
| `GET` | `/api/requests/:id` | Full spec + `cursorCopy` + `issueDraft` |
| `PATCH` | `/api/requests/:id` | `{ status }` — `new` \| `in-cursor` \| `done` |

### Spec file schema

Each request is one markdown file. **Preserve these headings** when editing:

```yaml
---
id: <uuid>
status: new | in-cursor | done
requesterLabel: <optional>
createdAt: <ISO-8601>
---
```

```markdown
## Summary
## Context
## Success criteria
## Out of scope
## Raw answers
## GitHub issue draft
```

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

See [`.env.example`](.env.example). No secrets required for the core loop.

## Repository metadata

```yaml
project: plain-janes-task-ask
stack: node express vitest
meetup: cursor-calgary-may-2026
core_loop: request-form -> spec-md -> inbox -> copy-for-cursor
```

## License

MIT — see [LICENSE](LICENSE).
