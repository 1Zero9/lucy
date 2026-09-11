# LUCY — MASTER CONTROL FILE

**Status:** Foundation — Phases 0–6 built (see `CHANGELOG.md`, `BUILD_PLAN.md`). Nothing deployed to real users yet. Phase 7 (Intelligence) requires explicit owner approval before any work starts.  
**Owner intent:** Build a small, dependable learning workspace for fewer than five private users.  
**Primary rule:** Do not expand scope without an explicit instruction from the owner.

This file is the highest-level project instruction for human developers and coding agents.
If another project document conflicts with this file, **MASTER.md wins** unless the owner explicitly changes the decision.

---

## 1. Product definition

**LUCY** is a fast, private, course-agnostic learning and note-taking workspace.

It must work for any course, module, subject, certification, apprenticeship, school programme, professional qualification, personal research project, or other learning context.

LUCY must **never assume Biology, university, semester structures, or any particular subject**. Examples in screenshots or seed data are examples only.

### Product line
**LUCY — Your learning workspace.**

### Supporting line
**Capture. Organise. Learn. Succeed.**

---

## 2. Non-negotiable UX principles

Priority order:

1. Ease of use
2. Speed
3. Data safety
4. Predictability
5. Security/privacy
6. Responsive behaviour
7. Customisation
8. Feature count

A feature is not successful merely because it works technically.

### The interface must be

- Logical.
- Predictable.
- Fast.
- Safe.
- Calm.
- Responsive.
- Obvious without a guide.
- Consistent across PC, Mac, iPad and iPhone.

### Core UX test

A first-time user should understand the primary action on a screen within approximately three seconds.

### Safety UX

- No manual Save button for notes.
- Work saves locally first where offline support is active.
- Cloud sync state is visible but quiet.
- Reversible actions should use Undo instead of modal confirmation.
- Delete means soft-delete first.
- Permanent delete requires explicit confirmation.
- Version restore must not destroy newer history.

---

## 3. Scope

### v1 target
Fewer than **5 users**.

Each user has a completely separate account.

### Explicitly NOT in v1

- Sharing notes between users.
- Collaboration.
- Teams.
- Organisations.
- Role/permission matrices.
- Public notebooks.
- Social features.
- Real-time collaborative editing.
- AI assistant.
- Vector search.
- Durable Objects.
- Complex distributed architecture.
- Native iOS/macOS/Windows applications.
- Gamification.
- Productivity scoring.

Do not add these “because they may be useful later”.

---

## 4. Platform

LUCY is Cloudflare-native.

### Front end
- Next.js
- React
- TypeScript
- vinext deployment to Cloudflare Workers
- Responsive PWA

### Cloud
- Cloudflare Workers
- Cloudflare D1
- Cloudflare R2

### Client-side
- IndexedDB for offline/local working data, introduced deliberately in the offline phase.

### Authentication
Use a maintained authentication library compatible with Cloudflare/D1.
Current preferred direction: Better Auth with D1.

Do not write a custom password/session implementation.

---

## 5. Environments

| Environment | Purpose |
|---|---|
| Local | Development using local bindings/data |
| Development | Shared remote test environment using `lucy-dev` |
| Production | Real user data using existing `lucy` D1 |

Production data must never be used for routine development.

### Cloudflare resources

Production:
- D1: `lucy` — already created by owner
- R2: `lucy-files`

Development:
- D1: `lucy-dev`
- R2: `lucy-files-dev`

Optional independent backup bucket later:
- R2: `lucy-backups`

---

## 6. Data ownership and isolation

Every private user-owned record must have an authoritative owner.

The authenticated session determines `user_id`.

### Forbidden pattern

```text
GET /api/notes?user_id=user-123
```

where the client is trusted to choose ownership.

### Required pattern

```text
authenticated request
    -> server validates session
    -> server obtains user ID
    -> query scoped to session user ID
```

Never trust a user-supplied owner ID for authorisation.

---

## 7. Core information model

LUCY uses flexible primitives.

- User
- Workspace
- Period (optional)
- Module / Subject
- Folder (optional)
- Note
- Note Version
- Tag
- Sticky
- Task
- Attachment
- Research Item
- Drawing
- Flashcard
- User Settings

Do not hard-code “college”, “semester”, “biology”, or “lecture” as required structural concepts.

---

## 8. Phase 1 — build only this first

### Infrastructure
- Cloudflare-ready project.
- Existing production D1 binding documented.
- `lucy-dev` provisioning script.
- R2 provisioning script.
- D1 migrations.
- Environment separation.
- Health endpoint.
- CI build check.

### Account foundation
- Sign up.
- Email verification if email delivery is configured.
- Sign in.
- Sign out.
- Session protection.
- Profile.
- Account-level settings.

### Onboarding
Ask:
1. What are you using LUCY for?
2. What are you studying/working on?
3. Create first workspace.
4. Create first module/subject.

All labels should remain adaptable.

### Notes foundation
- Create module/subject.
- Create note.
- Edit note.
- Autosave.
- Reopen note.
- Soft-delete.
- Recently Deleted.
- Note version creation and restore.
- User isolation.

Do not move to Phase 2 until the Phase 1 acceptance tests pass.

---

## 9. Phase 1 acceptance tests

A release candidate must prove:

1. User A can create an account.
2. User B can create an account.
3. User A cannot retrieve User B data by changing URLs, request bodies, query parameters or IDs.
4. User creates a workspace.
5. User creates a module/subject.
6. User creates a note.
7. Note persists after browser restart.
8. Note persists after logout/login.
9. Note appears on a second authenticated device.
10. Delete moves note to Recently Deleted.
11. Note can be restored.
12. Older note version can be restored without losing later history.
13. A failed remote request does not falsely display “Saved”.
14. Application is usable on phone, tablet and desktop widths.
15. No production database is accessed from tests/local development by default.

Offline-first editing is a planned foundation feature, but do not fake offline guarantees before IndexedDB sync is implemented.

---

## 10. Feature sequence after Phase 1

Only after explicit approval:

1. Richer note editor
2. Tags/folders/colour customisation
3. Files/R2
4. Stickies
5. Tasks/reminders
6. IndexedDB offline queue and sync
7. Search
8. Drawing/handwriting
9. Research
10. Flashcards
11. Revision centre
12. AI-enhanced features

---

## 11. Coding rules

- TypeScript strict mode.
- Avoid `any`.
- Validate server inputs.
- Server-side authorisation on every private resource operation.
- Keep database access in `src/lib/db`.
- Keep auth code in `src/lib/auth`.
- Keep R2 access in `src/lib/storage`.
- Use migrations for every schema change.
- Never mutate production schema manually as part of normal development.
- Never commit credentials or secrets.
- Prefer small components/functions.
- Avoid premature abstraction.
- Add tests around security boundaries and data loss scenarios before visual polish.
- Do not silently replace libraries or architecture decisions.
- Keep dependencies modest.

---

## 12. Design source of truth

See `docs/LUCY_STYLE_GUIDE.md`.

When screenshots and written rules conflict, prefer the written rules.

Biology/Chemistry content in visual references is demonstration content only.

---

## 13. Agent completion protocol

At the end of each coding task, report:

- What changed.
- Files changed.
- Database migration added, if any.
- Commands run.
- Tests/build result.
- Security implications.
- Known limitations.
- The next smallest recommended task.

Do not automatically start that next task unless asked.
