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
- [x] IndexedDB (src/lib/offline/store.ts — note cache + mutation queue)
- [x] Local write-first path (note edits cache locally, then queue a sync)
- [x] Pending sync queue (FIFO, collapses rapid edits, rebases after each sync)
- [x] Reconnect sync (online / visibility / 20s interval / load triggers)
- [x] Conflict strategy (ifUnmodifiedSince -> 409; losing edit kept as an
      'import' version, server copy adopted, quiet banner)
- [x] Offline UX (OfflineBar, offline-aware save states, minimal PWA + SW)
- [x] Multi-device tests (API-level: 409 conflict + history preservation,
      second-session visibility)

Scope: notes only. Tasks / stickies / files remain online-only for now.

## Phase 6 — Learning tools
- [x] Search (query-time LIKE across notes/tasks/stickies/modules/research/
      flashcards, owner + active-workspace scoped; no semantic/vector)
- [x] Drawing (freehand canvas -> PNG in R2, private download)
- [x] Research (saved sources with Markdown annotations)
- [x] Flashcards (front/back, per-module, light SM-2 state)
- [x] Revision (due queue + reveal + Again/Hard/Good/Easy grading)

## Phase 7 — Intelligence
Only after explicit owner approval.

## Phase 8 — Notes, Study & Trust Upgrade
Build spec derived from UPGRADE.md's assessment (11 Sep 2026, reviewed v0.15.0).
Implemented in the doc's own "Recommended implementation order" — data-safety
first, then one complete subject→note→flashcard journey, then editor/control
polish, then offline/export/backup. GDPR/privacy-policy items (§9) are
product/legal decisions, not engineering tasks — tracked separately below,
not silently authored.

### 8A — Save/recovery and local-privacy fixes (UPGRADE.md §7) — done, v0.16.0
- [x] `flush()` keeps queued edits on transient/server-error failures instead
      of dropping them — only conflict (409, handled) and a small set of
      genuinely terminal errors clear the queue
- [x] `preserveAsHistory()` checks the response and only proceeds with the
      conflict swap once history is confirmed saved; keep the local losing
      edit recoverable if preservation itself fails
- [x] IndexedDB cache/queue keys are account-scoped (not just note id), so a
      second account on the same device/browser can't see the first
      account's cached notes or queued edits
- [x] Sign-out flushes pending work first, then warns (with a count and
      confirm) before leaving unsynced edits on a shared device — never
      silently discards; the sync layer detaches from the account
      (`setAccount(null)`) so its in-memory state can't linger for the next
      sign-in either
- [~] Tests: failed-save-retains-queue and conflict-preservation-confirmed
      are verified by code review + tsc/lint (pure branching logic, no
      external state); server-side behaviour (409/401/ownership) already
      covered by the existing e2e suite (20/20, unaffected). Account
      isolation itself is IndexedDB-only client logic with no browser test
      harness in this repo (node --test has no indexedDB) — needs a manual
      two-account-in-one-browser smoke test before calling it fully proven.

### 8B — One complete subject → note → flashcard → source-note journey — done, v0.17.0
(UPGRADE.md §1–2, the "smallest complete task" from the recommended order,
not the full IA rework)
- [x] Module page (`/modules/:id`) opens into its notes and flashcards;
      module cards on `/modules` are clickable through to it (Rename/Delete
      moved off the card face into the module page itself). Files-by-module
      explicitly out of scope — attachments aren't module-scoped in the
      schema (noted in the page's own doc comment).
- [x] Creating a note from within a module (`NewNoteButton moduleId=`)
      assigns it to that module automatically; flashcards created on a
      module's page default to it too (`defaultModuleId`)
- [x] Note editor shows a visible "Subject" field (first field in the meta
      bar, ahead of Pin/colour/folder/tags per the brief); PATCH
      /api/notes/:id gained `moduleId` reassignment with a same-workspace
      ownership check
- [x] Flashcard create form accepts an optional source note (`notes` prop,
      "From note" select); flashcards list and revision session both show
      "Open source note" linking back to it
- [x] Note editor's "Link to note" (new toolbar button, separate from the
      raw-URL link button) searches workspace note titles and inserts
      `[title](/notes/id)` — the link is id-based so it keeps working after
      the target note is renamed, even though the visible text can go stale
- [x] A compact "Flashcards from this note" section under a note surfaces
      cards sourced from it
- [x] Incidental fix: `.btn` had no `text-decoration: none`, so a Link
      styled as a button (e.g. "Review N cards") rendered underlined —
      exactly the §4 finding. Also relabelled "Revise N due" -> "Review N
      cards" / "Add" -> "Add flashcard" for explicit button language.

### 8C — Editor and controls (UPGRADE.md §3–5)
- [ ] Formatted (WYSIWYG-ish) editing by default — bold looks bold, headings
      look like headings; Markdown source view stays available, optional.
      Preserve existing content, version history, export, and offline path.
- [ ] Reorder the phone editor: breadcrumb + subject, title + save status,
      compact formatting controls, writing surface, attachments/related
      below — writing starts near the top of the viewport, not ~560px down
- [ ] Subject assignment stays visible; colour/tags/history/export/delete
      move into a Details/overflow control
- [ ] Consistent button language: filled purple = primary action, neutral =
      secondary, overflow menu for rename/delete; explicit labels ("New
      subject", "Add flashcard", "Review 3 cards") instead of bare "Add"
- [ ] Clickable cards open their content; rename/delete move off the card
      face and into its menu
- [ ] Visual density pass: compact note rows (title, subject, excerpt,
      readable date), fewer shadows/borders, consistent input/button
      heights, clean previews (strip raw `##`/`**` from Home excerpts),
      relative dates ("Yesterday", "11 Sep")
- [ ] Mobile bottom bar reconsidered around the notes/study brief (proposed:
      Notes, Subjects, Create, Review, Search) — update docs alongside code
      if this navigation change is agreed and shipped
- [ ] Desktop: quiet subject/nav rail beside a note list next to the editor,
      so switching notes doesn't require a full page return

### 8D — Offline scope, export, and backup (UPGRADE.md §8)
- [ ] State offline capability precisely in-product: cached note editing is
      supported today; new-note creation and file downloads currently
      require a connection — don't imply broader offline support than exists
- [ ] Design (separately) "keep available offline" for selected
      subjects/files, with confirmed availability and storage usage shown
- [ ] Offline note creation as its own scoped, tested capability
- [ ] Status copy: Saved, Saving…, Saved on this device, Syncing…, and
      action-required errors — consistent everywhere
- [ ] Scheduled backups (D1 + R2 contents), tested restoration into a
      separate environment, documented retention/RTO/data-loss window
- [ ] User-facing export: readable notes, original attachments, structured
      metadata preserving relationships; verify the export is independently
      usable

### Not an engineering task — needs an owner decision (UPGRADE.md §9)
Tracked here so it isn't lost, not authored unilaterally:
- [ ] Privacy notice, retention rules, account-deletion process, and a
      rights-request contact for the deployed app
- [ ] Confirm controller/processor responsibilities and lawful basis for the
      actual deployment (owner + any school relationships)
- [ ] If/when school-managed or under-18 users are in scope: age-appropriate
      explanations and protective defaults, considered deliberately, not
      assumed
