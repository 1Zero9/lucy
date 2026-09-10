# LUCY — Product & Visual Style Guide

**Product line:** Your college brain.  
**Product promise:** Capture. Organise. Learn. Succeed.

LUCY is a private, fast and dependable college workspace. The interface must be obvious on first use, consistent across desktop/tablet/mobile, and safe enough that a student never has to wonder whether work has been saved.

---

## 1. Design principles

1. **Obvious beats clever.** Every screen has one primary action.
2. **Fast capture.** A note, task, sticky, drawing or file should be reachable in one or two actions.
3. **Predictable navigation.** Home → Module → Note is the dominant mental model.
4. **Quiet safety.** Autosave, sync, offline storage, versioning and recovery are visible but never noisy.
5. **Progressive complexity.** Advanced tools appear when needed; the default experience stays simple.
6. **Touch first, keyboard excellent.** Targets are generous on iPad/iPhone; shortcuts accelerate desktop use.
7. **Private by default.** No cross-user sharing in v1. The authenticated account is the security boundary.
8. **Accessible.** Do not communicate status by colour alone. Maintain WCAG AA contrast for normal text.

---

## 2. Brand

### Name
**LUCY**

### Taglines
Primary: **Your college brain.**  
Functional: **Your college notes, organised. Simple, secure, wherever you are.**  
Supporting: **Capture. Organise. Learn. Succeed.**

### Logo / app icon
Use the supplied rounded-square L + leaf icon. Do not redraw, stretch, rotate or add text inside the app icon.

Minimum clear space around the standalone mark: 12.5% of icon width.

---

## 3. Typography

### UI font — Inter
Use for navigation, controls, editor chrome, tables, metadata, forms and body copy.

- Body: 16/24, Regular 400
- Small: 14/20, Regular 400
- Caption: 12/16, Medium 500
- Button: 14/20, SemiBold 600
- Navigation: 14/20, Medium 500

### Display font — Plus Jakarta Sans
Use sparingly for welcome headings, module titles and marketing surfaces.

- H1: 32/40, Bold 700
- H2: 24/32, Bold 700
- H3: 20/28, SemiBold 600
- Card title: 16/24, SemiBold 600

**Fallback:** system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif.

---

## 4. Colour system

| Token | Hex | Use |
|---|---|---|
| Primary | `#7C3AED` | Main action, active navigation, brand |
| Primary strong | `#4F46E5` | Hover/pressed, gradient depth |
| Secondary | `#06B6D4` | Supporting actions, files, research |
| Accent | `#22D3EE` | Highlights, active focus |
| Success | `#16A34A` | Saved, complete, recovered |
| Warning | `#F59E0B` | Due soon, caution |
| Error | `#EF4444` | Failed, destructive, urgent |
| Info | `#2563EB` | Syncing, guidance, informational |
| Background | `#F8FAFC` | App canvas |
| Surface | `#FFFFFF` | Cards, editor, panels |
| Border | `#E2E8F0` | Dividers and input borders |
| Text | `#0F172A` | Primary text |
| Muted | `#64748B` | Secondary text |

### Module colours
Users may colour-code modules. Use soft backgrounds with strong readable labels:
Purple `#EDE9FE`, cyan `#CFFAFE`, green `#DCFCE7`, amber `#FEF3C7`, rose `#FCE7F3`, blue `#DBEAFE`.

Do not let module colour alter core action colours or status semantics.

---

## 5. Shape, spacing and elevation

Use an 8px spacing rhythm with 4px allowed for tight internal alignment.

- Small radius: 8px
- Control radius: 12px
- Card radius: 18px
- Feature panel / modal: 24px
- Pills: 999px

Cards should feel light, not floating. Prefer a 1px border and subtle shadow over heavy drop shadows.

---

## 6. Icon system

Use **Lucide-style line icons**: 24×24 viewBox, 2px stroke, round line caps and joins. The supplied SVG set follows this visual grammar.

| Feature | Icon |
|---|---|
| Home | home |
| Modules | modules |
| Notes | notes |
| Tasks | tasks |
| Calendar | calendar |
| Search | search |
| Stickies | stickies |
| Files | files |
| Flashcards | flashcards |
| Drawing | drawing |
| Research | research |
| Revisions | revisions |
| Settings | settings |
| Help | help |
| Profile | profile |

Default icon size: 20px in controls, 24px in navigation, 28–32px in feature cards. Never use icons without labels where meaning is not universally obvious.

---

## 7. Navigation

### Desktop
Persistent left rail:
**Home, Modules, Notes, Tasks, Search**  
Secondary: **Files, Research, Flashcards, Revisions**  
Utility: **Recently Deleted, Help, Settings, Profile**

### Mobile
Bottom navigation:
**Home · Modules · + · Tasks · Search**

The centre `+` opens:
**New Note · Sticky · Task · Drawing · Scan/Photo · File**

Keep primary navigation to five visible destinations on mobile.

---

## 8. Home screen

The home screen answers:
1. What am I doing now?
2. What is coming up?
3. Where was I last?

Recommended order:
- Search
- Today
- Continue / active notes
- Coming up
- Stickies
- Recent files

Do not add productivity scores, charts or decorative dashboards in v1.

---

## 9. Modules

Module cards contain:
- Module name
- Module code
- Colour
- Optional icon
- Note/file count
- Next important deadline

Inside a module:
**Overview · Notes · Files · Tasks · Revision**

Users may organise notes into lightweight folders/weeks, but LUCY must not force deep folder navigation.

---

## 10. Notes and active notes

### Note editor
The editor is the primary workspace. Keep chrome minimal.

Top:
- Breadcrumb/module
- Title
- Favourite/pin
- More menu

Formatting:
- Heading
- Bold / italic / underline
- Bullets / numbered list / checklist
- Quote
- Link
- Table
- Highlight
- Insert image/file
- Drawing

Bottom/status:
**Saved**, **Saving…**, **Offline — saved locally**, or **Syncing…**

### Active notes
“Continue” surfaces the 3–5 most recently edited notes. An active note card shows module, title, last edit, sync state and optional due/revision marker.

---

## 11. Stickies

Stickies are fast capture, not miniature documents.

Types:
- Remember
- Question
- Exam
- Idea

A sticky can be converted to a **Note, Task or Reminder**. Keep them short, colour-coded and visible on Home.

---

## 12. Research workspace

Research is a focused capture surface, not a browser replacement.

Tabs:
**Web · PDFs · Notes · Saved**

Capabilities:
- Save URL/reference
- Add source title/author/date
- Highlight excerpt
- Add personal annotation
- Link research item to a module/note
- Create citation metadata
- Search saved research

Future AI may summarise saved sources, but original source metadata must remain intact.

---

## 13. Drawing / handwriting

Optimised for iPad and Apple Pencil, while remaining usable with mouse/touch.

Toolbar:
- Pen
- Highlighter
- Eraser
- Lasso/select
- Undo/redo
- Stroke width
- Colour
- Zoom / fit

Drawings may exist standalone or embedded in a note. Save drawing data separately from its rendered preview so it remains editable.

---

## 14. Revision centre

Revision is generated from the student's own material.

Views:
- Topics
- Flashcards
- Quick quiz
- Exam notes
- Revision sessions
- Progress

Do not turn LUCY into a gamified productivity product. Progress indicators should answer useful questions such as “What have I revised?” rather than score the user.

---

## 15. Flashcards

Card front: one question or prompt.  
Card back: concise answer plus optional source note.

Controls:
**Again · Hard · Got it**

Support:
- Manual cards
- Cards created from selected note text
- Future AI-assisted suggestions
- Module/topic filtering
- Star/favourite
- Review history

Large touch targets are mandatory.

---

## 16. Tasks, reminders and deadlines

Task fields:
- Title
- Module
- Due date/time
- Priority
- Notes
- Reminder
- Linked note/file

Default views:
**Today · Upcoming · Completed**

Deadlines should use plain language: **Today**, **Tomorrow**, **2 days**, then date.

---

## 17. Files

Support PDFs, images, Office documents and audio attachments.

Views:
**All · PDFs · Images · Documents · Audio**

Every file belongs to the authenticated user and may optionally link to a module or note. Files are stored in R2; D1 stores metadata and the R2 key.

---

## 18. Revisions / history / recovery

Every important document supports version history.

History shows:
- Current
- Timestamped versions
- Restore action

Delete is soft-delete first. Recently Deleted should retain recoverable items before permanent purge.

A restore must create a new current version rather than destroying later history.

---

## 19. Alerts and banners

Use the supplied banner assets as visual references.

### Success
Green. “Saved”, “Uploaded”, “Note restored”. Auto-dismiss where appropriate.

### Information
Blue. Sync state, new feature guidance, non-urgent information.

### Offline
Purple/blue. “Saved on this device. We’ll sync when reconnected.”

### Reminder
Amber. Upcoming deadlines; never imply an error.

### Warning
Amber. User can continue, but should understand consequences.

### Error / action needed
Red. Use only when action genuinely failed or data requires intervention.

**Never show a red alert for ordinary validation or informational states.**

---

## 20. Dialogues and destructive actions

Avoid confirmation dialogues for reversible actions.

Example:
Delete note → immediately move to Recently Deleted → show **Undo**.

Require confirmation for:
- Permanent delete
- Delete account
- Remove all local offline data
- Discard unresolved sync conflict

Destructive buttons are red and never the default focused action.

---

## 21. Empty states

Every empty state explains what the feature is and gives one action.

Example:
**No notes yet**  
“Your lecture notes will appear here.”  
`Create your first note`

Avoid cartoon-heavy empty screens that dominate the interface.

---

## 22. Onboarding

Four lightweight steps:
1. Profile
2. College
3. Academic year
4. First module

Then create an optional **Welcome to LUCY** demo module containing:
- Example note
- Example sticky
- Example task
- Example file

The user can delete the demo module at any time.

---

## 23. Help and guides

In-product help:
- Getting started
- Create a module
- Take and format notes
- Stickies
- Files and PDFs
- Drawing
- Research
- Tasks and reminders
- Revision and flashcards
- Offline use
- Restore deleted work
- Account and security

Use short steps, screenshots and contextual links. Help must never be required to understand primary navigation.

---

## 24. Responsive behaviour

### Phone
Single column. Bottom navigation. Editor toolbar collapses intelligently.

### Tablet
Two-pane where useful: module list + note, or notes + editor. Drawing receives full-screen mode.

### Desktop
Left navigation + content. Optional secondary pane. Editor max width should be configurable.

Do not merely shrink desktop UI onto mobile.

---

## 25. Interaction and motion

- Hover: 120–160ms
- Panels/modals: 180–220ms
- Avoid decorative motion during note taking
- Respect `prefers-reduced-motion`
- Autosave should never shift layout
- Skeletons are preferable to blocking spinners for content areas

---

## 26. Accessibility

- WCAG AA target
- 44×44px minimum touch target
- Visible keyboard focus
- Full keyboard navigation for core workflows
- Semantic headings and landmarks
- Labels for icon-only controls
- Status conveyed by text/icon as well as colour
- Support browser zoom and larger text
- Never block copy/paste

---

## 27. Security and trust UX

LUCY should communicate security without security theatre.

Show:
- Account currently signed in
- Last successful sync
- Offline state
- Recovery/version availability
- Active sessions in Settings

Never expose internal database IDs, R2 paths, tokens or technical error dumps to the user.

---

## 28. Writing style

LUCY copy is short, calm and specific.

Use:
- “Saved”
- “Couldn’t upload the file. Try again.”
- “This note is available offline.”
- “Moved to Recently Deleted.”

Avoid:
- “Oops!”
- “Something magical happened”
- “Uh-oh”
- unnecessary AI language
- blame

---

## 29. Engineering tokens

Canonical machine-readable tokens are included in:
- `tokens/lucy-tokens.css`
- `tokens/lucy-tokens.json`

Use tokens rather than hard-coded colours throughout the application.

---

## 30. Asset inventory

### Brand
- App icon master
- 1024, 512, 256, 192, 180, 128, 64 and 32px PNGs

### Icons
Individual SVG and PNG assets for core navigation and actions.

### Banners
- Information
- Saved
- Syncing
- Offline
- Reminder
- Warning
- Error / action needed
- Note restored

### Reference
The approved LUCY UI style board is included for implementation reference.

---

## 31. LUCY v1 visual acceptance test

A screen is ready when:
- The primary action is obvious within 3 seconds.
- Navigation behaves the same as equivalent screens.
- Save/sync state is understandable.
- No destructive action is easy to trigger accidentally.
- It works at phone, tablet and desktop widths.
- Keyboard and touch users can complete the core action.
- Colour is not the only carrier of meaning.
- The screen uses the shared tokens and icon grammar.
- There is no unnecessary dashboard clutter.
