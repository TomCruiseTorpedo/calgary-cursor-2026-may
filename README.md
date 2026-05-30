# Plain Jane's Task Ask

*Plain English in. Builder-ready spec out.*

**Calgary Cursor — May 2026 buildathon** · [`calgary-cursor-2026-may`](https://github.com/TomCruiseTorpedo/calgary-cursor-2026-may)

## Live demo

| Surface | URL |
|---------|-----|
| **Production** | https://calgary-cursor-2026-may.vercel.app |
| Stakeholder intake | https://calgary-cursor-2026-may.vercel.app/request |
| Developer Inbox | https://calgary-cursor-2026-may.vercel.app/inbox |

Deployed on Vercel (Express `@vercel/node`, framework preset **Other**). Request data on serverless uses ephemeral `/tmp` storage — fine for demo; durable storage is out of scope for v1.

## How it was built

The **entire** buildathon submission — product scope, UI, Express API, tests, specs, and deploy config — was authored with **[Cursor](https://cursor.com) only**. No Claude Code, Codex, GitHub Copilot, Cline, Kilo Code, Antigravity, Kiro, or other agentic coding harness was used to build this repository.

## Summary for reviewers

| Criterion | How this project addresses it |
|-----------|-------------------------------|
| **Everyday pain point** | Vague, typo-ridden stakeholder asks hide scope before any code is written. |
| **AI-native** | Output is a **minified PRD + ADR + Cursor prompt block**, not prose for humans only. |
| **Cursor fit** | Stakeholders never touch GitHub; builders **Copy for Cursor** from the inbox. |
| **Working demo** | Live URLs above; core loop testable in under two minutes (see below). |
| **Quality** | `npm test` — 16 Vitest tests (normalization, spec writer, API). |

## Problem

Developers lose time **before implementation**: messy language, missing success criteria, and context trapped in chat or email. Plain Jane's Task Ask converts that intake into a **spec-shaped, agent-ready brief** stakeholders can submit without learning GitHub.

## What it does

1. **Request form** (`/request`) — three steps, plain English, optional screenshot, optional **Polish with AI** (OpenRouter `openrouter/free` when `OPENROUTER_API_KEY` is set).
2. **Normalization** — rules-based cleanup (typos, goal minification, vagueness flags); optional LLM polish on the same pipeline.
3. **Spec file** — `.spec-workflow/specs/requests/<id>.md` with **PRD (minified)**, **ADR**, **Cursor prompt (minified)**, verbatim raw intake, GitHub issue draft.
4. **Developer Inbox** (`/inbox`) — numbered requests, preview, **Copy for Cursor**, status (`new` → `in-cursor` → `done`).

**Example input:** `sales need to exprot dashbord to csv asap` → cleaned goal, scoped open questions, paste-ready Cursor block.

## Judge checklist (core loop)

1. Open **[/request](https://calgary-cursor-2026-may.vercel.app/request)** — complete all steps (try intentionally messy text).
2. Open **[/inbox](https://calgary-cursor-2026-may.vercel.app/inbox)** — confirm the new request appears with a stable `#` number.
3. Preview the spec — verify **PRD**, **ADR**, and **Cursor prompt** sections (not just raw text).
4. **Copy for Cursor** — clipboard should contain the minified agent brief.
5. *(Optional)* Run locally: `npm install && npm test && npm start` (Node **24+**, see `.nvmrc`).

## Architecture

```
/request  →  POST /api/requests  →  *.md spec on disk  →  /inbox  →  Cursor
```

**Stack:** Node 24 · Express · static HTML/CSS/JS · Vitest · Clay design tokens ([`DESIGN.md`](DESIGN.md))

**Deep dive (agents & implementers):** [`AGENTS.md`](AGENTS.md) — API routes, spec schema, file map, conventions.

## Environment variables

See [`.env.example`](.env.example). **None required** for the rules-only demo. Optional: `OPENROUTER_API_KEY` (+ `OPENROUTER_SITE_URL` on Vercel) for the AI polish toggle.

## License

Apache License 2.0 — see [LICENSE](LICENSE).
