# LUCY Architecture

## Target

A deliberately small Cloudflare-native architecture for fewer than five users.

```text
Browser / PWA
     |
     v
Cloudflare Worker (vinext / Next.js)
     |
     +---- D1: structured data
     |
     +---- R2: private file objects
```

Later:

```text
IndexedDB
  -> local save
  -> pending sync queue
  -> Worker
  -> D1
```

## D1

Use D1 for:
- auth/account metadata
- workspaces
- periods
- modules
- notes
- note versions
- tags
- stickies
- tasks
- attachment metadata
- research metadata
- drawing metadata
- flashcards
- preferences

Do not store large file bodies in D1.

## R2

Use R2 for:
- PDFs
- images
- scans
- office documents
- audio
- rendered drawing previews
- other attachments

Objects are private. Access is mediated by authenticated server routes.

## Bindings

Expected logical bindings:

- `DB` -> D1
- `FILES` -> R2

Production and development use different resources.

## Backups

Application recovery:
- note versions
- soft delete
- Recently Deleted

Platform recovery:
- D1 Time Travel according to Cloudflare plan/capabilities

Independent backup:
- introduce `lucy-backups` and scheduled export later

Sync is not backup.

## Search

Start with normal database/full-text search when introduced.
Do not add semantic/vector search in the foundation build.

## AI

Not part of foundation architecture.
