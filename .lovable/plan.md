
## Checklist — Opsette Marketplace Tool

A standalone productivity app for creating reusable, multi-step checklists with templates, drag-to-reorder steps, progress tracking, and offline support.

### Core data model (localStorage)
- **Checklist**: `id, name, description?, isTemplate, sourceTemplateId?, steps[], createdAt, updatedAt, completedAt?`
- **ChecklistStep**: `id, label, url?, category? ('doc'|'invoice'|'workspace'|'task'|'custom'), completed, sortOrder`

### Layout
- **Sticky header**: "Checklist" title, subtitle "Reusable checklists for any process", dark mode toggle (BulbOutlined/BulbFilled + Switch)
- **Sidebar** (collapsible Drawer on mobile via `Grid.useBreakpoint`): grouped lists "Templates" and "Active", each item shows name + step count, "+ New Checklist" button at top
- **Main panel**: editable checklist (empty state when none selected)
- **Footer**: About / Privacy modal links

### Checklist editor
- Inline-editable name and description
- Step rows with: drag handle, completion checkbox, inline-editable label, URL link icon (popover to edit), category tag, delete button
- Drag-to-reorder using `@dnd-kit/core` + `@dnd-kit/sortable`
- "Add Step" input row at bottom with optional URL + category picker
- Progress indicator (Progress bar + "X/Y steps")
- Confetti + success state when 100% complete
- Action buttons: **Use Template** (templates only — prompts for new name, creates active copy), **Save as Template** (active only), **Copy Summary** (formatted plain text → clipboard + toast), **Delete**
- Template badge to visually distinguish templates

### Theming
- Ant Design `ConfigProvider`: `colorPrimary: '#52c41a'`, `borderRadius: 8`, dark/light algorithm toggle
- Category tag colors: doc=blue, invoice=green, workspace=purple, task=orange, custom=default
- Dark mode preference persisted to localStorage

### PWA & deployment
- `vite-plugin-pwa` with `base: '/checklist/'`, autoUpdate, dev disabled, navigateFallbackDenylist for `/~oauth`
- Manifest: name "Checklist", theme `#52c41a`, bg `#f5f5f5`, standalone, scoped to `/checklist/`, 192/512 icons (512 also maskable)
- Iframe guard in `main.tsx` unregisters service workers when embedded

### Public assets
- Generate green checkmark `favicon.svg`, `favicon.ico`, `icon-192.png`, `icon-512.png`, `robots.txt`

### Files to create/update
- `package.json` — add `antd@^6`, `@ant-design/icons@^6`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `vite-plugin-pwa`, `canvas-confetti`, `uuid`
- `vite.config.ts` — base path + VitePWA config
- `tsconfig.app.json` — `strict: false`, `noImplicitAny: false`, `skipLibCheck: true`
- `index.html` — viewport, theme-color, icons, OG tags, description
- `src/main.tsx` — iframe SW cleanup, mount App with ConfigProvider
- `src/index.css` — reset + print styles
- `src/App.tsx` — ConfigProvider wrapper, theme state, layout
- `src/types.ts` — Checklist & ChecklistStep types
- `src/lib/storage.ts` — localStorage CRUD helpers
- `src/lib/summary.ts` — Copy Summary formatter
- `src/components/Header.tsx`, `Sidebar.tsx`, `ChecklistEditor.tsx`, `StepRow.tsx`, `AddStepForm.tsx`, `EmptyState.tsx`, `AboutModal.tsx`, `PrivacyModal.tsx`
- `public/` — favicon.svg, favicon.ico, icon-192.png, icon-512.png, robots.txt
