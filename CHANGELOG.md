# Changelog

All notable changes to LUCY are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[Semantic Versioning](https://semver.org/) as adapted in `docs/VERSIONING.md`
for a pre-1.0 foundation build.

## [Unreleased]

## [0.11.1] — 2026-09-11
### Fixed
- Service worker no longer registers in `npm run dev` (only in production) —
  it was surviving local dev-server restarts and serving a stale cached app
  shell, which read as a stuck "offline" state.

## [0.11.0] — 2026-09-11
### Added
- Mobile bottom navigation (Home · Modules · **+** · Tasks · Search) per
  `docs/LUCY_STYLE_GUIDE.md` §7, phones only.
- "+" fast-capture sheet: New Note, Sticky, Task, Drawing, Scan/Photo
  (device camera via file input), File — each lands you directly on the
  created item.

## [0.10.0] — 2026-09-11
### Changed
- Design pass applying `docs/LUCY_STYLE_GUIDE.md`: design tokens (radius,
  spacing, shadow), Inter + Plus Jakarta Sans typography, a grouped/labelled
  sidebar nav with per-feature icons, correctly-sized app-icon assets and
  manifest entries, and offline/save-state banner colours matching the
  guide's semantics.
### Fixed
- Offline indicator could get stuck showing "offline" after a single failed
  request; it now self-heals against `navigator.onLine`.

## [0.9.1] — 2026-09-10
### Fixed
- `wrangler.jsonc` `env.dev` now carries its own `main` / `assets` / `cache` /
  `version_metadata` (Wrangler does not inherit these into named
  environments) — `npm run deploy:dev` works end to end.

## [0.9.0] — 2026-09-10 — Phase 6: Learning tools
### Added
- Search (query-time, owner + workspace scoped, across notes/tasks/
  stickies/modules/research/flashcards).
- Research: saved sources with Markdown annotations.
- Flashcards with a light SM-2 scheduler (`src/lib/srs.ts`) and a revision
  session (due queue, reveal, Again/Hard/Good/Easy).
- Drawing: freehand canvas saved as a private PNG in R2.
- `/study` hub consolidating Research/Flashcards/Revision/Drawing.

## [0.8.0] — 2026-09-10 — Phase 5: Offline reliability
### Added
- Local-first note editing: IndexedDB cache + mutation queue
  (`src/lib/offline/`), reconnect sync, and a conflict strategy
  (`ifUnmodifiedSince` → 409; the losing edit is preserved as a note version,
  never silently dropped).
- Minimal PWA: manifest + service worker (app shell offline, `/api/*` never
  cached).
- Offline-aware save states — never shows a false "Saved".

## [0.7.0] — 2026-09-10 — Phase 4: Quick organisation
### Added
- Stickies board.
- Tasks with due dates, an in-app reminder field, and due-based views
  (Overdue / Today / Next 7 days / Later).
- Home gains Today, Coming up, Stickies and Recent files.

## [0.6.0] — 2026-09-10 — Phase 3: Files
### Added
- R2 file upload with owner-scoped private download
  (`src/lib/storage/`, `attachments` table).
- Per-note and workspace-wide file views; Markdown image embeds.

## [0.5.0] — 2026-09-10 — Phase 2: Rich note experience
### Added
- Markdown notes: dependency-free allowlist-only renderer
  (`src/lib/markdown.ts`), formatting toolbar, Write/Split/Preview.
- Note colours, pin, workspace-scoped tags, lightweight folders.

## [0.4.0] — 2026-09-10 — Phase 1C: Safe notes
### Added
- Notes: create/read/update, debounced autosave with honest save state,
  version snapshots + restore (later history always preserved), soft
  delete → Recently Deleted → restore.

## [0.3.0] — 2026-09-10 — Phase 1B: Flexible learning structure
### Added
- Workspaces and modules (full CRUD), optional periods.
- Course-agnostic onboarding; responsive Home, Modules, Workspaces views.

## [0.2.0] — 2026-09-10 — Phase 1A: Identity
### Added
- Better Auth email/password, protected app shell, profile/settings.
- Owner-scoped session helpers (`requireUser`, `requireApiUser`) used by
  every private route from here on.

## [0.1.0] — 2026-09-10 — Phase 0: Bootstrap
### Added
- Next.js on Cloudflare Workers via vinext; `wrangler.jsonc` bindings for D1
  (`lucy` / `lucy-dev`) and R2 (`lucy-files` / `lucy-files-dev`); local D1
  migrations; `/api/health`.

[Unreleased]: https://github.com/1Zero9/lucy/compare/main...HEAD
[0.11.1]: https://github.com/1Zero9/lucy/commit/bd5a00e
[0.11.0]: https://github.com/1Zero9/lucy/commit/382922c
[0.10.0]: https://github.com/1Zero9/lucy/commit/0a74e21
[0.9.1]: https://github.com/1Zero9/lucy/commit/dd1e849
[0.9.0]: https://github.com/1Zero9/lucy/commit/4dda35f
[0.8.0]: https://github.com/1Zero9/lucy/commit/daafc9f
[0.7.0]: https://github.com/1Zero9/lucy/commit/c2ae0ad
[0.6.0]: https://github.com/1Zero9/lucy/commit/5cff612
[0.5.0]: https://github.com/1Zero9/lucy/commit/61572ab
[0.4.0]: https://github.com/1Zero9/lucy/commit/5e9eec2
[0.3.0]: https://github.com/1Zero9/lucy/commit/45b8958
[0.2.0]: https://github.com/1Zero9/lucy/commit/878bc50
[0.1.0]: https://github.com/1Zero9/lucy/commit/7d95fb7
