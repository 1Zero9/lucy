# Changelog

All notable changes to LUCY are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[Semantic Versioning](https://semver.org/) as adapted in `docs/VERSIONING.md`
for a pre-1.0 foundation build.

## [Unreleased]

## [0.17.0] — 2026-09-11
### Added
- **Subjects are now places to work** (UPGRADE.md §1): module cards open
  into a new `/modules/:id` page showing that subject's notes and
  flashcards, instead of only offering Rename/Delete. New notes created
  there are assigned to the subject automatically; new flashcards default
  to it too.
- **Note → subject**: the note editor's meta bar gained a visible "Subject"
  field (the first field, ahead of Pin/colour/folder/tags) that reassigns
  the note's module — `PATCH /api/notes/:id` now accepts `moduleId`, with
  the same same-workspace ownership check the folder field already had.
- **Note → flashcard**: the flashcard create form now accepts an optional
  source note ("From note"); the flashcards list and revision session both
  show "Open source note" linking back to it.
- **Note → note**: a new "Link to another note" toolbar button (distinct
  from the raw-URL link button) searches workspace note titles and inserts
  an id-based link — it keeps working even after the target note is
  renamed.
- **Flashcard → source**: a compact "Flashcards from this note" section
  now appears under a note when it has any.
### Fixed
- `.btn` was missing `text-decoration: none`, so a `<Link>` styled as a
  button (e.g. "Review 3 cards") rendered with a browser-default
  underline. Also relabelled "Revise N due" → "Review N cards" and
  "Add" → "Add flashcard" for clearer button language (UPGRADE.md §4).

## [0.16.0] — 2026-09-11
### Fixed
- **Offline save/recovery** (`src/lib/offline/sync.ts`): `flush()` was
  dropping a queued edit on *any* non-conflict, non-auth error, including
  transient server failures — a 500 could silently lose an unsynced note
  change. Now only conflict (handled explicitly) and genuinely terminal
  4xx failures clear the queue; 5xx and network errors keep retrying.
  `preserveAsHistory()` (which saves the "losing" copy of a note before a
  conflict adopts the server's version) previously ignored whether that
  save actually succeeded — it now checks the response and holds the
  local edit until preservation is confirmed, instead of swapping it out
  on a guess.
### Added
- **Shared-device / account isolation**: the local IndexedDB cache and
  sync queue are now account-scoped (`accountId` on every cached note and
  queued edit). A second account signing in on the same browser/device can
  no longer see or accidentally flush the first account's cached notes or
  unsynced edits — the sync layer refuses to touch storage until it knows
  which account it's scoped to (`setAccount()`), and re-scopes on every
  account change without needing a full page reload.
- **Sign-out with pending work**: signing out now flushes any unsynced
  edits first; if some remain (offline, or a server issue), it tells you
  how many and lets you choose — sync on next sign-in, or cancel — instead
  of silently discarding them or leaving them exposed to the next account
  on a shared device.

## [0.15.0] — 2026-09-11
### Changed
- **Home Experience Upgrade** (UPGRADE.md), a full recomposition of the
  authenticated Home screen around three groups — Continue, Today,
  Workspace — instead of five same-weight panels:
  - **Continue**: one featured (most recently edited/pinned) note in a
    larger card with a text snippet, then up to three compact rows.
  - **Today**: one card combining due/overdue tasks with the next
    upcoming deadline, instead of separate "Today" and "Coming up" panels.
  - **Workspace**: three quiet links (Stickies, Files, Modules) with
    counts, replacing the old full-weight Stickies/Recent-files panels
    and the standalone module grid.
  - Removed the "who am I / sign out" row from Home — reachable via
    Settings (desktop) or the new /more page (mobile) instead.
  - Standardised secondary-link copy to "View all" everywhere on Home
    (was a mix of "All tasks", "Open board", "All files", "Manage
    modules").
- **Mobile navigation**: the horizontal strip that duplicated the desktop
  sidebar nav above mobile content is gone. The bottom bar (Home, Modules,
  Create, Tasks, Search) is unchanged; everything else (Notes, Files,
  Study, Workspaces, Help, Settings, sign out) now lives at the new
  `/more` page, reached via a compact icon next to the LUCY mark.
- **Desktop nav**: the active-item pill is smaller and less saturated —
  a subtle tinted background with primary-coloured text instead of a
  solid light-purple fill, so the page content carries the visual weight.
- **Offline/sync copy**: the global offline banner now shows only when
  there's actual unsynced work (pending changes or an error), not for
  merely being offline with nothing at risk — it no longer competes with
  ordinary browsing or the sign-in screen. Wording standardised to
  "Offline — saved locally" / "Syncing…" in both the banner and the note
  editor's inline status. Files page now states plainly that files need a
  connection (only notes work offline).
### Fixed
- A CSS class (`.nav-group`) is now hidden outright on mobile instead of
  per-item — simpler and matches the new `/more` destination; the dead
  `onMobileBar`/`nav-mobile-hide` mechanism it replaced is removed.

## [0.14.1] — 2026-09-11
### Fixed
- The deployed dev site was still showing `v0.13.1` — 0.14.0 was deployed
  before its version-bump commit, so the shipped build predated the bump.
  Redeployed; live site now correctly shows `v0.14.0`.
- The sticky/100dvh sidebar treatment (0.13.1) leaked into the mobile
  layout, where `.shell` collapses to `display: block` and the sidebar
  becomes a slim icon strip — the un-reset `position: sticky; height:
  100dvh` pinned that strip open at full viewport height, pushing the
  entire page below the fold on phones. Reset to `position: static;
  height: auto` under the 760px breakpoint; the version label is hidden
  on mobile (no natural slot there yet — see 0.13.0's Limitations note).

## [0.14.0] — 2026-09-11
### Added
- **Forgot password**: a "Forgot password?" link on the sign-in screen,
  `/forgot-password` (request a reset link) and `/reset-password`
  (choose a new password) pages, wired to Better Auth's built-in
  `sendResetPassword`/`resetPassword` endpoints. Doesn't reveal whether an
  email has an account — same success message either way.
- **Branded transactional emails**: verification and password-reset emails
  now share a proper HTML template (`src/lib/email/templates.ts`) — LUCY
  logo, card layout, primary-colour button — instead of plain unstyled
  links. Logo URL is derived from the email's own link origin, so a
  dev-sent email points at the dev icon and a production-sent one at
  production's.
### Verified
- Full round trip tested live via the deployed Resend account (request →
  email delivered → callback redirect → password reset → sign-in with the
  new password), both for verification and password-reset.

## [0.13.1] — 2026-09-11
### Fixed
- Sidebar wasn't pinned to the viewport — on a tall page it stretched to the
  full content height, pushing the new version label (added in 0.13.0) far
  below the fold. `.sidebar` is now `position: sticky; height: 100dvh`, so
  it always fills the visible viewport and the version stays visible at
  its bottom regardless of page length.
### Added
- **Required email verification in production**, now that the Resend send
  path is proven end to end. Scoped to `isProductionEnv()` — dev stays open
  so the e2e suite and `seed:demo` (both create throwaway accounts with no
  inbox to click a link from) keep working. `autoSignInAfterVerification`
  added so clicking the link signs the user straight in instead of bouncing
  back to a blank sign-in form. Sign-up now shows a "check your inbox" state
  instead of silently redirecting to a page it can't reach yet. Friendly
  copy added for the `EMAIL_NOT_VERIFIED` sign-in error.

## [0.13.0] — 2026-09-11
### Added
- **Visual design pass**: a shared `EmptyState` component (icon + one-line
  explanation + one action, per `docs/LUCY_STYLE_GUIDE.md` §21) replacing
  ad-hoc empty copy across notes, modules, workspaces, trash, stickies,
  tasks, attachments, flashcards, research, drawings, and search. New
  `FlashcardsIcon`, `ResearchIcon`, `CalendarIcon`. Sign-in/sign-up screens
  now carry the LUCY mark and a subtle tinted background; Home gained a
  "Workspace" eyebrow label and icons on each summary section; Study hub
  tool cards gained icons. Buttons and links got a light hover/press
  transition instead of a hard snap.
- **Demo account + seed script** (`scripts/seed-demo.mjs`,
  `npm run seed:demo`): populates a demo account (`demo@1zero9.com`) with
  a realistic "CISSP Certification" workspace (3 modules, 2 folders, 5
  notes, 5 tasks, 3 stickies, 2 research items, 5 flashcards with review
  history, a file attachment, and a drawing) plus a second, sparser "French
  B2" workspace to show the workspace switcher. Idempotent — safe to
  re-run. Refuses to run against anything that looks like the production
  domain unless `ALLOW_PROD_SEED=yes` is set explicitly. Seeded live on
  `lucy-dev.1zero9.com`; production D1 remains untouched (verified: 0
  rows).

## [0.12.1] — 2026-09-11
### Added
- Dev-environment indicator so dev and production are never visually
  confused: a slim amber "DEV — test data, not production" banner on every
  page, and the sign-in/sign-up screens re-tint from purple to amber, both
  driven by a new plain (non-secret) `APP_ENV` var (`src/lib/env.ts`,
  `production` in wrangler.jsonc top level, `dev` in `env.dev` and
  `.dev.vars`). Production is unaffected — verified the banner is absent
  there.

## [0.12.0] — 2026-09-11
### Added
- **First production deploy.** Migrations 0001–0006 applied to the real
  `lucy` D1; `BETTER_AUTH_SECRET` set; deployed. Zero rows written —
  schema-only, ready for real accounts.
- **Custom domains** on the `1zero9.com` zone for both environments, with
  the `*.workers.dev` URL kept alive alongside each:
  `lucy.1zero9.com` (production), `lucy-dev.1zero9.com` (dev).
- **ESLint** (flat config, `typescript-eslint` + the two stable
  `eslint-plugin-react-hooks` rules — not the v7 "recommended" bundle,
  which pulls in React Compiler diagnostics this project doesn't use).
  `npm run lint` was broken since Phase 0; now passes clean.
- **Email sending infrastructure** (`src/lib/email/`): a dependency-free
  Resend client (plain `fetch`, no SDK) wired into Better Auth's email
  verification hook. Safely no-ops without `RESEND_API_KEY` — sign-up is
  unaffected either way. `requireEmailVerification` stays `false` until
  the key is set and the flow is exercised end to end.
### Fixed
- `deploy:dev` was deploying to a stray `lucy-dev-dev` Worker instead of
  `lucy-dev` (double env-suffix from `vinext-cloudflare deploy --env dev`).
  Now builds with `CLOUDFLARE_ENV=dev` and deploys the resolved config
  directly with plain `wrangler deploy`. Stray Worker deleted.
- Client-side errors no longer leak raw browser text (e.g. "Failed to
  fetch") — `src/lib/errors.ts`'s `friendlyError()` maps any network-level
  failure to calm copy across every component that talks to the API, and
  in the sign-in/sign-up form.

## [0.11.2] — 2026-09-11
### Fixed
- `deploy:dev` was deploying to a stray `lucy-dev-dev` Worker instead of
  `lucy-dev`: `vinext-cloudflare deploy --env dev` both bakes the env suffix
  into the built config's Worker name *and* forwards `--env dev` to the
  final `wrangler deploy`, double-applying it. `deploy:dev` now builds with
  `CLOUDFLARE_ENV=dev` and deploys the resolved config directly with plain
  `wrangler deploy` (no `--env`). Verified live: `lucy-dev` deployed to
  `https://lucy-dev.<subdomain>.workers.dev`, signed up, created a workspace,
  confirmed the row landed in remote `lucy-dev` D1 and production `lucy`
  D1 stayed empty. The stray `lucy-dev-dev` Worker was deleted.
- First real deploy: this is LUCY's first environment reachable outside a
  local machine (dev only — no production deploy).

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
