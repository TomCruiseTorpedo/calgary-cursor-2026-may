# Pain point — Plain Jane's Task Ask

## Problem (developer)

Developers lose hours turning vague asks from PMs, clients, founders, or designers into something Cursor can implement. The friction is **upstream of code**: unclear scope, missing success criteria, and context scattered across chat and email.

## Who we serve

| Role | Need |
|------|------|
| **Requester** | Product manager, client, non-dev founder, designer, support lead — people in **software delivery**, not consumer "life app" users |
| **Builder** | Developer using Cursor who needs a structured brief and a single place to pick up work |

## What v1 does

1. **Shareable intake** (`/request`) — three plain-English steps, no GitHub vocabulary; messy spelling and vague wording accepted.
2. **Normalization** — rule-based cleanup (typos, minified goal, vagueness/terminology flags); optional LLM refine via OpenRouter.
3. **AI-native spec** — `.spec-workflow/specs/requests/<id>.md` with **Cursor prompt (minified)** → **PRD (minified)** → **ADR** (scope + open questions) plus verbatim raw intake.
4. **Developer Inbox** (`/inbox`) — Open vs Resolved cards, numbered requests, optional screenshot preview, copy minified prompt for Cursor, GitHub issue draft, status `new | in-cursor | done`.

## What v1 does not do

- Full feature implementation in CI
- Stakeholder GitHub accounts
- Database-backed multi-tenant hosting

## Demo scenarios (judging / screenshots)

- PM: "Sales needs export to CSV on the dashboard before quarter-end."
- Client: "Can customers reset password without calling support?"
- Founder: "We need a waitlist page before we open beta."

## Success for the buildathon

The **core loop** works end-to-end: submit form → markdown spec file exists → appears in inbox → **Copy for Cursor** works.
