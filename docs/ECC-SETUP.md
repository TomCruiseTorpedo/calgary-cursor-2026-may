# ECC setup (Cursor, local only)

Everything Claude Code / ECC installs under `.cursor/` in this repo is **gitignored**. Teammates reinstall from this guide.

## Prerequisites

- Node.js 20+
- A local clone of [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) (or your team's ECC source)

## Install ECC into this project

From your ECC source directory, run the installer targeting **cursor-project** for this repo path. The install that produced `target.id: "cursor-project"` copies skills, hooks, and scripts into `.cursor/`.

If you use the configure flow, say **configure ecc** in Cursor and choose project-level install with the **core** profile (TypeScript, verification, security as needed).

## Copy scaffolds

After install, ensure these exist (copy from `scaffolds/cursor/` if missing):

| Scaffold | Destination |
|----------|-------------|
| `scaffolds/cursor/ecc-agent-data.json` | `.cursor/ecc-agent-data.json` |
| `scaffolds/cursor/rules/ecc-agent-data-home.mdc` | `.cursor/rules/ecc-agent-data-home.mdc` |
| `scaffolds/cursor/hooks.json` | merge into `.cursor/hooks.json` |

Memory for this meetup project lives at `~/.cursor/ecc-calgary-2026-may` (not `~/.claude`).

## Verify

1. Open the project in Cursor — `sessionStart` should run `cursor-session-env.js`.
2. Check `.env.example` for `ECC_HOOK_PROFILE` and disabled hooks.
3. Session data: `$ECC_AGENT_DATA_HOME/session-data/` when hooks are active.

## Plain Jane's Task Ask app

```bash
npm install
npm test
npm start
```

Open http://localhost:3000/request (stakeholders) and http://localhost:3000/inbox (developers).
