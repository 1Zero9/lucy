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
- [ ] Integrate maintained auth library
- [ ] User schema
- [ ] Signup
- [ ] Login
- [ ] Logout
- [ ] Protected app shell
- [ ] Profile/settings
- [ ] Security tests for anonymous access

**Exit:** Two test accounts can authenticate independently.

## Phase 1B — Flexible learning structure
- [ ] Workspace CRUD
- [ ] Optional period support
- [ ] Module/subject CRUD
- [ ] Course-agnostic onboarding
- [ ] Responsive Home
- [ ] Responsive Modules view

**Exit:** A user can set up an arbitrary learning context without college-specific assumptions.

## Phase 1C — Safe notes
- [ ] Note create/read/update
- [ ] Debounced autosave
- [ ] Visible save state
- [ ] Note version snapshots
- [ ] Soft delete
- [ ] Recently Deleted
- [ ] Restore
- [ ] Cross-account isolation tests

**Exit:** Core MASTER.md note acceptance tests pass.

## Phase 2 — Rich note experience
- [ ] Rich text editor
- [ ] Colours
- [ ] Tags
- [ ] Lightweight folders
- [ ] Pin/favourite
- [ ] Continue/active notes

## Phase 3 — Files
- [ ] R2 upload
- [ ] Private download route
- [ ] Attachment metadata
- [ ] File ownership tests
- [ ] PDF/image handling

## Phase 4 — Quick organisation
- [ ] Stickies
- [ ] Tasks
- [ ] Reminders
- [ ] Calendar-oriented due views

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
