# LUCY — Home Experience Upgrade

## Purpose

Make the authenticated Home screen feel as calm, obvious, and focused as the
sign-in screen. The primary job of Home is to help a person quickly resume
their learning; it is not a dashboard of every feature.

This is a UI/UX upgrade brief only. It does not expand the product scope or
change data ownership, authentication, offline sync, or storage architecture.

## Product principle

On arrival, a person should immediately understand:

1. What they were working on.
2. What needs attention today.
3. Where to capture a new note.

Everything else should be available, but visually secondary.

## Target Home layout

```text
Workspace selector                         New note

Search this workspace

Continue
[ most recently edited note ]
[ up to three recent notes ]

Today
[ due and overdue tasks ]             [ next upcoming deadline ]

Workspace
[ Stickies ]  [ Files ]  [ Modules ]
```

### Section behaviour

| Section | Purpose | Default presentation |
|---|---|---|
| Search | Find any existing learning material | Full-width, prominent field near the top |
| Continue | Resume active work | One featured note, then no more than three compact note rows |
| Today | Identify the immediate next action | One compact card combining overdue, due today, and next deadline |
| Workspace | Reach supporting material | Three quiet summary links/cards for Stickies, Files, and Modules |

Do not show separate large panels for Today, Coming up, Stickies, Recent files,
Continue, and Modules at the same visual weight.

## Styling direction

- Preserve the sign-in screen's generous whitespace, restrained shadows, soft
  borders, and single strong purple action colour.
- Use fewer containing cards. Group only meaningful units; use spacing and
  light dividers within a group.
- Make `New note` the one prominent page action. Keep it consistently placed
  at the top-right on desktop and in the centre mobile create action.
- Use `View all` consistently for secondary destinations rather than mixing
  phrases such as “All tasks”, “Open board”, “All files”, and “Manage modules”.
- Keep the desktop rail useful but visually quiet. The selected navigation pill
  should be smaller and less saturated so page content carries the focus.
- Use feature colours sparingly. Purple signals the current location and
  primary action; other feature colours should be limited to small icons or
  metadata, never competing panels.
- Avoid dense card grids. A clear vertical reading order is preferable for a
  personal learning workspace.

## Navigation

### Desktop

- Keep the persistent rail: Home, Search, Notes, Modules, Tasks.
- Keep Files and Study as secondary destinations.
- Retain Workspaces, Help, and Settings as account/utility destinations.
- Reduce the selected Home treatment to a compact, low-contrast active state.

### Mobile

- Keep only the bottom navigation visible: Home, Modules, Create, Tasks,
  Search.
- Do not render the desktop secondary/sidebar navigation as a horizontal menu
  above mobile content.
- Put Files, Study, Workspaces, Help, and Settings behind a single `More` or
  profile destination.
- Preserve 44px minimum touch targets.

## Note editor follow-up

The editor should remain the primary work surface. In a later, separately
scoped pass, keep title and save status visible and place pin, colours, folder,
tags, version history, and delete in a compact details or overflow control.
This prevents note metadata from competing with writing.

## Offline and file trust

- Keep note sync state honest and quiet: `Saved`, `Saving…`, `Offline — saved
  locally`, and `Syncing…`.
- Show a full offline banner only when it communicates actionable unsynced work;
  do not let it dominate sign-in or ordinary browsing.
- State clearly that attachments are online-only until offline file support is
  deliberately built. Do not imply that files are locally available when they
  are not.
- Preserve the current private-file model: authenticated server routes validate
  ownership before retrieving R2 objects; raw R2 keys remain private.

## Acceptance criteria

1. A new user can identify the main next action on Home in about three seconds.
2. `Continue` and `New note` are the visual priorities.
3. Home presents no more than three primary content groups before supporting
   workspace links.
4. Mobile has no duplicated desktop navigation above the page content.
5. All existing Home information remains reachable without adding a new
   dashboard screen.
6. Offline and file availability messaging remains accurate.
7. The change uses existing LUCY design tokens and retains responsive,
   keyboard-accessible controls.

## Suggested implementation order

1. Remove duplicated mobile navigation and simplify the active rail styling.
2. Recompose Home around Search, Continue, Today, and Workspace.
3. Standardise secondary-link copy and reduce card/border density.
4. Verify desktop, tablet, and phone layouts with real long titles, empty
   states, and offline note state.
5. Run lint, typecheck, relevant tests, and a production build before release.
