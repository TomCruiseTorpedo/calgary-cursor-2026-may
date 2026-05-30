# CLAUDE.md

Instructions for Claude and other coding agents working in this repository.

## Read first

1. [AGENTS.md](AGENTS.md) — architecture, API routes, spec schema, conventions
2. [README.md](README.md) — product summary, quick start, core-loop verification
3. [.spec-workflow/specs/pain-point.md](.spec-workflow/specs/pain-point.md) — problem and users

## Project

| Field | Value |
|-------|--------|
| Name | Plain Jane's Task Ask |
| Repo | `calgary-cursor-2026-may` |
| Stack | Node 24, Express, static HTML/CSS/JS, markdown on disk |
| Event | Calgary Cursor meetup, May 2026 |

## Core loop (must keep working)

Messy stakeholder text at `/request` → `lib/normalize-request.js` (PRD + ADR + minified prompt) → `POST /api/requests` writes `.spec-workflow/specs/requests/<id>.md` → `/inbox` → **Copy for Cursor** copies the minified prompt block, not raw intake.

## Commands

```bash
npm install
npm test
npm start
```

## Do not

- Commit `.cursor/` (local ECC harness; see `docs/ECC-SETUP.md`)
- Commit `.env` or secrets
- Edit `docs/private/` (gitignored)
- Add competitor comparison tables or hackathon strategy to public docs

## UI

Follow [DESIGN.md](DESIGN.md) (Clay design tokens).
