/**
 * In-product Help (docs/LUCY_STYLE_GUIDE.md §23). Content lives here rather
 * than in the database — it's the same for every user and changes with the
 * app, not with their data. Rendered through the existing Markdown component,
 * so it's just short, calm, plain-language text (§28 Writing style).
 */
export type HelpTopic = {
  slug: string;
  title: string;
  summary: string;
  body: string;
};

export const HELP_TOPICS: HelpTopic[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    summary: "The shape of LUCY: workspaces, modules, and where things live.",
    body: `LUCY is organised around three levels:

- A **workspace** is the top level — a degree, a certification, a course, a personal project. You can have more than one; switch between them from the workspace picker on Home.
- A **module** is a subject or topic inside a workspace — create as many as you need from Modules.
- Everything else — notes, tasks, stickies, files, research, flashcards, drawings — belongs to the current workspace, and can optionally be tied to a module or note.

When you sign up, LUCY asks what you're using it for and creates your first workspace. From there, Home is your starting point: it shows what's due today, what's coming up, your stickies, recent files, and your most recently edited notes.`
  },
  {
    slug: "create-a-module",
    title: "Create a module",
    summary: "Group related notes and work under a subject or topic.",
    body: `Go to **Modules** and use the field at the top to add one — just a name. You can rename or delete a module at any time from the same screen; deleting a module doesn't delete the notes inside it, it just detaches them.

Modules are colour-coded automatically, and you can link notes, tasks, research items and flashcards to a module to keep related work together. There's no required folder structure underneath — organise as much or as little as you like.`
  },
  {
    slug: "notes",
    title: "Take and format notes",
    summary: "Fast, safe writing with Markdown formatting and full history.",
    body: `Open **Notes** and select **New note** — you're straight into the editor with nothing to configure first.

Notes save themselves as you type; there's no Save button. The status next to the title tells you what's happening: **Saving…**, **Saved**, or, if you're offline, **Saved on this device — will sync when online**.

Formatting is Markdown: use the toolbar for bold, italic, headings, lists, checklists, quotes and links, or type Markdown directly. Switch between **Write**, **Split** and **Preview** to see the formatted result.

Every note keeps a **History** of earlier versions. Nothing is ever silently overwritten — if a note changes somewhere else while you were editing, your version is kept in History rather than lost.

Give a note a colour or pin it so it's easy to find again; add tags and put it in a folder from the panel above the editor.`
  },
  {
    slug: "stickies",
    title: "Stickies",
    summary: "Fast, throwaway capture — not a document.",
    body: `**Stickies** are for the thing you want to jot down right now without opening a note: a quick reminder, a question to look up later, an idea mid-lecture.

Add one from the Stickies board or the **+** button on mobile. Tap into a sticky to edit it directly, pick a colour, or delete it. If something on a sticky turns out to matter, copy it into a proper note — stickies aren't versioned or searchable in the same depth notes are.`
  },
  {
    slug: "files",
    title: "Files and PDFs",
    summary: "Upload PDFs, images and documents — private to you.",
    body: `Upload a file from a note's **Attachments** section, or from **Files** for anything not tied to a specific note. Images, PDFs and plain text open right in the browser; other file types download.

Every file is private — only your signed-in account can retrieve it, whoever else might guess its name or link. There's a 25 MB size limit per file.

Deleting a file moves it out of the live list; it isn't gone until you delete it permanently.`
  },
  {
    slug: "drawing",
    title: "Drawing",
    summary: "A simple freehand canvas for sketches and diagrams.",
    body: `Open **Study → Drawings** and select **New drawing** for a blank canvas. Draw with your finger, mouse, or a stylus; pick a colour and stroke size, use the eraser, or clear and start again.

Drawings save automatically a moment after you stop drawing. Give a drawing a title from the top of the editor, and delete it from there too when you're done with it.`
  },
  {
    slug: "research",
    title: "Research",
    summary: "Save sources and references with your own notes on them.",
    body: `**Study → Research** is for things you've found and want to keep: a link, a book, a paper, a video. Add a title and, if there is one, a URL — then write your own annotation underneath in Markdown, whenever you're ready.

Research items can be linked to a module or note so they surface alongside the work they informed.`
  },
  {
    slug: "tasks",
    title: "Tasks and reminders",
    summary: "Deadlines and to-dos, grouped by how soon they're due.",
    body: `Add a task from **Tasks** or the **+** button, with an optional due date. Tasks are grouped as **Overdue**, **Today**, **Next 7 days**, **Later** and **No date** — tick one off, or tap **More** to add a reminder time or extra detail.

Reminders are shown in the app (on the task and on Home's "Today"/"Coming up" sections) — LUCY doesn't send push or email notifications yet, so a reminder is something you'll see when you're in the app, not an alert on your device.`
  },
  {
    slug: "revision-and-flashcards",
    title: "Revision and flashcards",
    summary: "Turn your own material into cards, and revise what's due.",
    body: `Create flashcards from **Study → Flashcards** — a front (the question) and a back (the answer), optionally attached to a module. New cards, and any due for review, show up in **Revision**.

Revising is simple: see the front, think of the answer, reveal the back, then grade yourself **Again**, **Hard**, **Good** or **Easy**. LUCY uses your grade to space out when a card comes back — cards you find easy appear less often, cards marked **Again** come straight back round in the same session.`
  },
  {
    slug: "offline-use",
    title: "Offline use",
    summary: "Notes keep working when your connection drops.",
    body: `If you lose your connection while editing a note, LUCY keeps working — your edits are saved on the device you're using and sent as soon as you're back online. You'll see **Saved on this device — will sync when online** instead of **Saved**, and a bar at the bottom of the screen while you're offline.

If the same note was changed elsewhere while you were offline, LUCY doesn't overwrite either version: the other device's version stays current, and your offline edit is kept safely in that note's History so you can find and reuse it.

Other parts of LUCY — tasks, stickies, files, research, flashcards, drawings — currently need a connection to create or change.`
  },
  {
    slug: "restore-deleted-work",
    title: "Restore deleted work",
    summary: "Deleting is reversible, on purpose.",
    body: `Deleting a note, file, task, sticky or similar item moves it to **Recently Deleted** rather than removing it straight away — look for the link near the top of the relevant screen, or use **Undo** right after deleting. Restoring it brings it back exactly as it was.

For notes specifically, every earlier version is also kept in that note's **History**, so you can go back further than the most recent save — restoring an older version never destroys the versions that came after it.

Permanently deleting something (for files, from Recently Deleted) is a separate, deliberate action and asks you to confirm first.`
  },
  {
    slug: "account-and-security",
    title: "Account and security",
    summary: "Your account is the boundary — nothing is shared by default.",
    body: `Everything you create in LUCY belongs to your signed-in account. There's no sharing between accounts in this version — what you see is always scoped to you, checked on the server every time, never decided by anything in your browser.

Manage your profile — display name and email — from **Settings**. Sign out from the top of most screens when you're done, especially on a shared device.

LUCY never shows you internal technical details (database ids, storage paths, raw errors) — if something goes wrong you'll see a plain description of what happened instead.`
  }
];

export function getHelpTopic(slug: string): HelpTopic | undefined {
  return HELP_TOPICS.find((t) => t.slug === slug);
}
