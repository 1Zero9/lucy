# AGENTS.md — Instructions for Coding Agents

Read these files before editing code:

1. `MASTER.md`
2. `docs/PRODUCT_SPEC.md`
3. `docs/ARCHITECTURE.md`
4. `docs/SECURITY.md`
5. `docs/LUCY_STYLE_GUIDE.md`
6. `BUILD_PLAN.md`

`MASTER.md` has precedence.

## Working method

- Work on the **smallest complete task** requested.
- Do not build future phases speculatively.
- Do not redesign the product without an explicit request.
- Do not add AI, collaboration, sharing, teams or complex infrastructure in Phase 1.
- Preserve course-agnostic naming.
- Prefer “workspace”, “module/subject”, “note”, “task”, “research” over hard-coded college-specific terminology.
- Treat user isolation and data recovery as release blockers.
- Never point local/test configuration at production D1 by default.
- Never expose D1/R2 credentials or resource paths to clients.
- Never trust a client-supplied `user_id`.

## Before making a change

1. State the acceptance criterion being addressed.
2. Inspect related code/migrations.
3. Check whether a migration is required.
4. Check security impact.
5. Keep the change scoped.

## Database

- D1 schema changes require a migration in `/migrations`.
- Use SQLite/D1-compatible SQL.
- Use foreign keys where sensible.
- Index common owner/filter paths.
- Soft-delete important user content.
- Note version restore creates a new version/current state; it does not erase history.

## UI

- One primary action per screen.
- No manual Save button for notes.
- Avoid confirmation dialogs for reversible actions.
- 44px minimum touch targets.
- Mobile is a designed experience, not scaled-down desktop.
- Use tokens from `docs`/`src` rather than inventing random colours.
- Icons follow Lucide visual language.
- Do not use subject-specific imagery as core navigation.

## Security

Every private data access must derive the owner from the authenticated server session.

Required conceptual pattern:

```ts
const user = await requireUser(request);
return findNotesForUser(env.DB, user.id);
```

Never:

```ts
return findNotesForUser(env.DB, request.query.userId);
```

## Definition of done

Before claiming completion:

- Typecheck.
- Lint.
- Run relevant tests.
- Run production build if practical.
- Check responsive behaviour for changed UI.
- Verify no secret was added.
- Verify no user-isolation regression.
- Summarise actual results; do not claim tests that were not run.
