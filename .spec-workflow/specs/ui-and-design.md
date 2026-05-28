# UI and design — Plain Jane's Task Ask

Design tokens: [`DESIGN.md`](../../DESIGN.md) (Clay via `npx getdesign@latest add clay`).

## Two surfaces

### Public intake (`/request`)

- **Audience:** non-developer requesters
- **Tone:** warm, patient, zero dev jargon (no PR, repo, branch, issue)
- **Layout:** single column, Clay cream canvas, saturated step cards (lavender → peach → ochre → pink clarify)
- **Hero:** tagline on **two lines** — “Plain English in.” / “Builder-ready spec out.”
- **Flow:** 3 steps with progress dots → clarify (checkboxes, optional notes, optional screenshot, optional **Polish with AI**) → thank-you recap
- **Required fields:** wish, **name + role**, audience, frequency, success
- **Screenshot:** custom pill **Choose image** control on clarify step; preview thumbnail before submit
- **Accessibility:** labels on every control, focus rings, sufficient contrast

### Developer Inbox (`/inbox`)

- **Audience:** builder
- **Tone:** utilitarian, information-dense
- **Layout:** two-column — sidebar (stacked cards) + detail pane
- **Sidebar cards:**
  - **Open (N)** — `new` and `in-cursor` requests
  - **Resolved (N)** — `done` requests (separate card, muted row styling)
- **List rows:** `#1`, `#2`, … · summary · requester · date · status chip
- **Detail:** status banner (resolved / in-cursor), title, meta, optional screenshot preview, actions, monospace spec preview
- **Actions:** Copy for Cursor, Copy GitHub issue draft, status dropdown
- **Colors:** cream/soft sidebar, teal **Copy for Cursor**, mint/ochre/lavender status chips

## Navigation

- Header: **New Request** → `/request`, **Developer Inbox** → `/inbox`
- `/` redirects to `/request`

## Copy guidelines

| Surface | Say | Avoid |
|---------|-----|-------|
| Request | "What should be easier?", "How will you know it's working?" | issue, PR, merge, deploy |
| Inbox | "Copy for Cursor", status **Done** (shown as Resolved in UI) | Third-party tool names, internal codenames |

## Responsive

- Mobile-first intake (stakeholders may use phones)
- Inbox: sidebar stacks above detail on narrow viewports; each list scrolls independently
