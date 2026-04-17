# Checklist

Reusable checklists for any multi-step process. Build a template once, spin up a fresh active run every time — track progress, attach links, and copy a clean summary to share with your team.

Part of the [Opsette](https://opsette.io) Marketplace: standalone, offline-first tools for small service businesses.

## What it does

- Create templates for repeatable processes (client onboarding, project closeout, punch lists, handovers)
- Spin up an active copy of a template each time you run the process
- Drag to reorder steps, attach URLs, tag by category (doc, invoice, workspace, task, custom)
- Progress bar, confetti on 100%, copy-summary to clipboard
- Dark mode, mobile-first, installable as a PWA
- All data stays in your browser — no account, no tracking, no backend

## Stack

Vite + React 18 + TypeScript, Ant Design v6, `@dnd-kit` for reordering, `vite-plugin-pwa` for offline support, localStorage for persistence.

## Development

```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # production build in dist/
npm run preview  # preview the production build
npm test         # run Vitest
```

## Deploy

Static site — ships to GitHub Pages (or any static host) from the `dist/` folder. `base` in `vite.config.ts` is `/`; set it to your subpath if hosting under one.
