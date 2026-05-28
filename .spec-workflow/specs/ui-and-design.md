# UI and design — Plain Jane's Task Ask

## Two surfaces

### Public intake (`/request`)

- **Audience:** non-developer requesters
- **Tone:** warm, patient, zero dev jargon (no PR, repo, branch, issue)
- **Layout:** single column, large type (18px+ body), generous spacing
- **Flow:** 3 steps with progress indicator → scripted clarify → thank-you recap
- **Colors:** soft neutral background, accent for primary button (teal or slate-blue)
- **Accessibility:** labels on every control, focus rings, sufficient contrast

### Developer Inbox (`/inbox`)

- **Audience:** builder
- **Tone:** utilitarian, information-dense
- **Layout:** list/table of requests; detail pane with markdown preview
- **Actions:** Copy for Cursor, Copy GitHub issue draft, status dropdown
- **Typography:** system UI + monospace for spec preview
- **Colors:** light gray chrome, white cards, status chips (new / in-cursor / done)

## Navigation

- Header links: **New request** → `/request`, **Inbox** → `/inbox`
- `/` redirects to `/request`

## Copy guidelines

| Surface | Say | Avoid |
|---------|-----|-------|
| Request | "What should be easier?", "How will you know it's working?" | issue, PR, merge, deploy |
| Inbox | "Copy for Cursor", "Mark in progress" | Third-party tool names, internal codenames |

## Responsive

- Mobile-first intake (stakeholders may use phones)
- Inbox usable on tablet+; table scrolls horizontally on small screens
