# Pain point — Plain Jane's Task Ask

## Problem (developer)

Developers lose hours turning vague asks from PMs, clients, founders, or designers into something Cursor can implement. The friction is **upstream of code**: unclear scope, missing success criteria, and context scattered across chat and email.

## Who we serve

| Role | Need |
|------|------|
| **Requester** | Product manager, client, non-dev founder, designer, support lead — people in **software delivery**, not consumer "life app" users |
| **Builder** | Developer using Cursor who needs a structured brief and a single place to pick up work |

## What v1 does

1. **Shareable intake** (`/request`) — three plain-English steps, no GitHub vocabulary.
2. **Scripted clarify** — follow-up choices in the browser, then a recap in their words.
3. **Spec on disk** — `.spec-workflow/specs/requests/<id>.md` with stable headings for agents.
4. **Developer inbox** (`/inbox`) — list requests, copy for Cursor, optional GitHub issue draft, status `new | in-cursor | done`.

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
