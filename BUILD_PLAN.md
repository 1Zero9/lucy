# LUCY Build Plan

## Phase 0 — Bootstrap
- [ ] Install dependencies
- [ ] Authenticate Wrangler
- [ ] Verify existing `lucy` D1
- [ ] Create/verify `lucy-dev`
- [ ] Create/verify `lucy-files`
- [ ] Create/verify `lucy-files-dev`
- [ ] Fill resource IDs in Wrangler configuration
- [ ] Apply migrations locally
- [ ] Run app locally
- [ ] Deploy development environment
- [ ] Confirm `/api/health`

**Exit:** Cloudflare development deployment can read/write the dev D1 only.

## Phase 1A — Identity
- [x] Integrate maintained auth library
- [x] User schema
- [x] Signup
- [x] Login
- [x] Logout
- [x] Protected app shell
- [x] Profile/settings
- [x] Security tests for anonymous access

**Exit:** Two test accounts can authenticate independently. — met

## Phase 1B — Flexible learning structure
- [x] Workspace CRUD
- [x] Optional period support (list / create / soft delete)
- [x] Module/subject CRUD
- [x] Course-agnostic onboarding
- [x] Responsive Home
- [x] Responsive Modules view

**Exit:** A user can set up an arbitrary learning context without college-specific assumptions. — met

## Phase 1C — Safe notes
- [x] Note create/read/update
- [x] Debounced autosave
- [x] Visible save state
- [x] Note version snapshots
- [x] Soft delete
- [x] Recently Deleted
- [x] Restore
- [x] Cross-account isolation tests

**Exit:** Core MASTER.md note acceptance tests pass. — met (tests 6-13, 15)

## Phase 2 — Rich note experience
- [x] Rich text editor (Markdown: toolbar + Write/Split/Preview, safe renderer)
- [x] Colours
- [x] Tags
- [x] Lightweight folders
- [x] Pin/favourite
- [x] Continue/active notes (Home "Continue" list, pinned-first ordering)

## Phase 3 — Files
- [x] R2 upload
- [x] Private download route
- [x] Attachment metadata
- [x] File ownership tests
- [x] PDF/image handling (inline for images/pdf/text; Markdown image embeds)

## Phase 4 — Quick organisation
- [x] Stickies
- [x] Tasks
- [x] Reminders (in-app remind_at; no push/email delivery yet)
- [x] Calendar-oriented due views (Overdue / Today / Next 7 days / Later / No date)

## Phase 5 — Offline reliability
- [ ] IndexedDB
- [ ] Local write-first path
- [ ] Pending sync queue
- [ ] Reconnect sync
- [ ] Conflict strategy
- [ ] Offline UX
- [ ] Multi-device tests

## Phase 6 — Learning tools
- [ ] Search
- [ ] Drawing
- [ ] Research
- [ ] Flashcards
- [ ] Revision

## Phase 7 — Intelligence
Only after explicit owner approval.
