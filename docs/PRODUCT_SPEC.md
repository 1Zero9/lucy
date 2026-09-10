# LUCY Product Specification

## Problem

Learning information becomes fragmented across lecture notes, PDFs, browser tabs, screenshots, tasks, handwritten material and revision tools. LUCY provides one dependable place to capture and organise it without imposing a complicated productivity system.

## Audience

Initial deployment: fewer than five known users.

The architecture and language must remain usable for any learning context:
- university/college
- school
- apprenticeship
- professional certification
- workplace learning
- personal research
- short course
- exam preparation

## Core nouns

### Workspace
Top-level learning context. Examples: “Computer Science Degree”, “CISSP”, “French B2”, “Leaving Cert”, “Photography”.

### Period
Optional grouping such as Year 1, Semester 2, Term 3, Sprint, Course Week, or custom.

### Module / Subject
A learnable topic inside a workspace.

### Note
Primary knowledge object.

### Sticky
Fast temporary capture.

### Task
Action/deadline.

### Research Item
Saved source/reference with annotation.

### Drawing
Editable sketch/handwriting object.

### Flashcard
Prompt/answer learning unit.

## Navigation

Desktop:
- Home
- Modules
- Notes
- Tasks
- Search
- secondary tools
- Help
- Settings

Mobile:
- Home
- Modules
- +
- Tasks
- Search

## Home priorities

1. Search
2. Today
3. Continue
4. Coming up
5. Stickies
6. Recent files

No charts or productivity scores in v1.

## Note safety

- Autosave.
- Honest save state.
- Version history.
- Soft delete.
- Recently Deleted.
- Restore.
- Later: local-first offline storage.

## Customisation

Allowed:
- module colour
- light/dark/system
- font size
- note width
- spacing preference
- selected Home widgets later

Avoid arbitrary UI builders/themes.

## Guides

In-product Help should eventually cover:
- Getting started
- Workspaces/modules
- Notes
- Files
- Stickies
- Tasks/reminders
- Drawing
- Research
- Flashcards
- Revision
- Offline use
- Restore/recovery
- Account/security
