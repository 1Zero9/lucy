# LUCY — Notes, Study, and Trust Upgrade Assessment

Assessment date: 11 September 2026. Reviewed development deployment: v0.15.0.

This replaces the earlier Home-only upgrade brief. It records a read-only review
of Home, Modules, Notes, the editor, Study, Flashcards, the phone layout, and
relevant repository code. Destructive operations were not exercised. This is
not a security certification or legal compliance opinion. Recheck findings
against the current implementation before making changes.

## Product brief

LUCY is primarily a notes-taking and study app for school and college users,
with flexible naming for other learning contexts. It must be intuitive, easy,
functional, private, and dependable. AI/Intelligence remains on the backlog.

The interface is becoming calmer, but its main weakness is how the pieces
connect. Students must navigate between separate tools and organise things
manually. The product should carry subject and source context for them.

These are planning proposals, not completed features or instructions to build
everything at once. MASTER.md remains the governing project document. Retain
Cloudflare Workers, D1, and private R2 as the platform.

## 1. Make subjects useful places to work

Modules cards look like destinations, but only offer Rename and Delete.
Selecting a subject should open its notes, with Files and Flashcards alongside
them. Creating an item there should automatically assign it to that subject.

Keep the organisation straightforward:

- Workspace: the overall course or learning context.
- Subject/module: where related material lives.
- Notes: the main working material.
- Files, flashcards, and tasks: connected supporting material.

Folders and tags are optional refinements. They currently receive more
prominence in the editor than the subject itself.

## 2. Complete the connections between items

| Relationship | Finding in reviewed version | Recommended experience |
|---|---|---|
| Note → subject | Editor exposes folders but no subject selector; the note update endpoint lacks module reassignment. | A visible subject label opens a searchable “Move to subject” picker. |
| Note → another note | Link button inserts Markdown URL syntax. | “Link to note” searches titles and inserts a readable link that survives renaming. |
| Note → flashcard | API supports a source note, but the flashcard form does not expose it. | Select text → “Create flashcard”; retain source note and subject automatically. |
| Flashcard → source | No source-note link is visible in the reviewed card interface. | “Open source note” during editing and revision. |
| File → subject/note | Files can attach to notes, but organisation is not clearly exposed. | Upload in context, inherit the subject, and attach existing files without duplicating them. |

Show related notes and flashcards in a compact section beneath the note.
Students should move from explanation to practice and back without searching
again. Validate every relationship against the authenticated owner on the server.

## 3. Make the editor the primary work surface

The default exposes Markdown punctuation and Write/Split/Preview modes. For
this audience, use formatted editing by default: bold looks bold, headings look
like headings, and pasted text remains readable. Markdown can remain optional.

Treat an editor replacement as a separately scoped task that preserves existing
content, history, exportability, and offline behaviour.

At the reviewed 390 × 844 phone viewport, writing begins roughly 560 pixels
down the screen. Metadata occupies much of the space above it.

Recommended order:

1. Small breadcrumb and visible subject.
2. Note title with quiet save status.
3. Compact formatting controls.
4. Writing surface.
5. Attachments and related material below.

Keep subject assignment easy to find. Put colour, tags, history, export, and
deletion in Details or an overflow menu. This revises the earlier brief:
hiding all organisation would go too far; subject context is essential.

## 4. Give buttons consistent meaning

Observed inconsistencies:

- Flashcard Edit and Delete visually run together.
- The flashcard subject dropdown looks unstyled beside styled inputs.
- “Revise 3 due” appears as underlined text inside a purple button.
- Delete is repeatedly visible beside ordinary content.
- Generic “Add” buttons provide little context.

Use filled purple for the primary action, neutral buttons for secondary actions,
and overflow menus for occasional management. Prefer explicit labels such as
“New subject”, “Add flashcard”, and “Review 3 cards”.

Clickable cards should open their content. Rename and delete belong in their
menu. Preserve 44px minimum touch targets, visible keyboard focus, accessible
names, and spacing even when reducing visual weight. Reversible deletion
should offer Undo; permanent deletion requires explicit confirmation.

## 5. Adjust visual density

Retain the purple, white, and muted background palette. Distraction comes from
large rounded cards, repeated borders, shadows, coloured icons, and large gaps
around small amounts of information. Home has better priorities, but four
recent notes still consume most of the desktop viewport.

Recommended styling:

- Compact note rows with title, subject, clean excerpt, and a useful date.
- Fewer shadows and heavy coloured card edges.
- Consistent input/button heights and spacing using existing design tokens.
- Purple mainly for selection and meaningful actions.
- Clean previews: Home currently exposes Markdown markers such as `##` and `**`.
- Consistent, readable dates such as “11 Sep” or “Yesterday”.

Carry the sign-in screen's restraint across. Its large amount of empty space
is less appropriate for a working notebook.

## 6. Prioritise notes in navigation

Mobile has improved: the duplicated top menu is gone. However, Tasks has a
permanent bottom destination while Notes does not. That priority does not
match the primary notes-and-study brief.

Proposed mobile destinations: Notes, Subjects, Create, Review, Search. Keep
Home and supporting tools accessible through the compact menu. This proposes
revising existing navigation rules; align project documents when implementing
an agreed navigation change.

On desktop, provide quiet subject/navigation controls and a note list beside
the editor, so switching notes does not require returning to a full-page list.
On phones, retain a simple list-to-note transition.

Home remains a useful starting point with Search, Continue, Today, and quiet
supporting links. Improving subject-to-note navigation matters more than
another Home redesign.

## 7. Resolve data-safety and local-privacy gaps

Server ownership checks and private file routes are useful foundations.
These are code-review findings, not reproduced incidents, and qualify earlier
positive assessments of offline reliability.

### Failed saves leave the retry queue

In [sync.ts](src/lib/offline/sync.ts), `flush()` removes queued edits for errors
other than conflicts or authentication failures, including server errors. This
can stop automatic recovery. Preserve pending work until success or an explicit,
recoverable resolution; transient failures must remain retryable.

### Conflict preservation is not confirmed

`preserveAsHistory()` ignores request failures and does not check response
success. The conflict branch then removes the queue entry and replaces the
local cache. The losing edit is not guaranteed to have been preserved.

Confirm durable preservation before replacing the local edit. Keep a recoverable
local copy while preservation is pending or fails.

### Shared-device isolation needs verification and correction

[IndexedDB records](src/lib/offline/store.ts) are not account-scoped.
The [service worker](public/sw.js) caches authenticated pages by URL, and
[sign-out](src/components/sign-out-button.tsx) does not clear or isolate stored
content. Test account-switch and offline-logout behaviour before shared school
device use.

Define account-scoped cache and queue lifecycles. Protect unsynced work during
logout without leaving it accessible to the next account. Do not silently erase
pending edits as a shortcut to solving local privacy.

## 8. Define offline access, backup, and export precisely

Existing cached note editing is supported. Creating a new note still requires
a server request, and file downloads bypass the offline cache. Do not represent
these capabilities as universal offline access.

Proposed improvements:

- “Keep available offline” for selected subjects and files, with confirmed
  availability and storage usage.
- A shared-device policy and controls protecting local data and pending work.
- Offline note creation, designed and verified as a separate capability.
- Quiet, accurate states: Saved, Saving…, Saved on this device, Syncing…,
  and action-required errors.

Independent backups remain future work in
[ARCHITECTURE.md](docs/ARCHITECTURE.md). No user-facing whole-workspace export
was found in the reviewed implementation.

Prioritise:

1. Scheduled backups covering database records and actual file contents.
2. Tested restoration into a separate environment, with documented retention,
   recovery time, and potential data-loss window.
3. Downloadable notes in readable formats, original attachments, and structured
   metadata preserving relationships. Verify exported material is usable.
4. Recovery controls that remain useful after refreshing or signing in again.

Do not promise that data “will always be there”. Provide verifiable evidence:
confirmed saves, offline copies, recoverable history, tested backups, and usable
exports. Sync is not backup. Backup retention must fit deletion obligations.

## 9. Make privacy understandable and actionable

Provide a privacy notice, retention rules, an account deletion process, a
rights-request contact, and documented provider arrangements. Confirm controller
and processor responsibilities, lawful bases, and any international-transfer
arrangements for the actual deployment.

GDPR involves purpose, lawful basis, transparency, minimisation, retention,
security, and accountability. Secure hosting alone does not establish compliance.
See the [DPC principles of data protection](https://dataprotection.ie/en/organisations/data-protection-basics/principles-data-protection).

School users may be children. Age-appropriate explanations and protective
defaults need deliberate attention. School-managed deployment raises different
responsibilities from individual accounts. See the
[DPC guidance on children's data](https://www.dataprotection.ie/en/dpc-guidance/fundamentals-child-oriented-approach-data-processing).

Keep AI on the backlog. A conventional notes app does not become high-risk
under the AI Act simply because students use it. Assess intended functionality
and applicable obligations when AI is proposed, especially anything influencing
educational assessment or access. See the
[European Commission AI Act guidance](https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act).
Recheck official guidance at implementation time.

## Recommended implementation order

1. Save/recovery and local-privacy fixes, with meaningful failure and
   account-isolation tests.
2. One complete subject → note → flashcard → source-note journey.
3. Formatted editor and consistent controls, including phone usability.
4. Fuller offline access, usable export, and verified backup restoration.

Establish privacy responsibilities and user-facing policies alongside this work,
before wider deployment. Implement the smallest complete task at each step.

## Acceptance checks for future implementation

- A student can open a subject, create a note, and find it there without
  selecting the subject again.
- Existing notes can move to a subject without losing content or relationships.
- Note links survive renaming; flashcards open their source notes.
- Formatting does not require Markdown knowledge; existing content and history
  survive editor changes.
- Phone users reach writing quickly, with usable controls and keyboard focus.
- Failed requests and failed conflict preservation retain recoverable edits.
- Offline content and pending mutations do not cross account boundaries.
- Offline labels describe confirmed capabilities.
- A backup restores in isolation and an export can be read independently.
- Implementation changes meet required typecheck, lint, relevant tests, practical
  production build, user-isolation, and secret-handling checks.

No implementation or test execution is claimed by this document.
