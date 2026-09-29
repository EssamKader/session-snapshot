---
name: session-snapshot
description: Save the current session's full working trail — goal, what was tried, methods, bugs with root cause and fix, decisions, files changed, open items, next steps — to a Markdown file before context compaction loses it. Inside a GitHub repo it commits the file to docs/sessions/ (pushes private repos, asks before pushing public ones); outside a repo it writes to Desktop\Claude Sessions\<date>_<project>_<session>\. Repeat runs add part-02, part-03…. Use when the user runs /session-snapshot, asks to save/snapshot/record the session or context, says context is getting long, or is about to /compact or stop for the day.
---

# Session snapshot

Write a faithful, readable record of **this session so far** so nothing important
is lost when the conversation is compacted or closed. The reader is the user (and
future sessions) coming back cold: they must be able to understand what happened,
why, and what to do next, without the chat.

A `PreCompact` hook (`scripts/precompact-hook.js`) separately saves a raw copy of
the transcript to the Desktop session folder automatically before any compaction.
That raw copy is a safety net; this skill produces the real write-up.

## Step 1 — Locate

Run the helper from the session's working directory and read its JSON:

```bash
node ~/.claude/skills/session-snapshot/scripts/locate.js "<current working directory>"
```

It returns `mode` (`github` or `local`), `targetDir`, `nextPart`, `project`,
`sessionId`, `repoRoot`, `branch`, `visibility` (`public` / `private` / …) and
`rawCopyDir`. Use these values as given; don't invent paths.

- If `mode` is `github`: the file goes in `targetDir` (inside the repo at
  `docs/sessions/<date>_<project>_<session8>/`).
- If `mode` is `local`: the file goes in `targetDir` (under
  `Desktop\Claude Sessions\`).

## Step 2 — Write the part file

File name: `part-<NN>_<short-topic-slug>.md` where `NN` = `nextPart`
zero-padded to 2 digits, and the slug is 3–6 words for what this part covered
(e.g. `part-01_omniroute-desktop-setup.md`). Create `targetDir` if needed.

If `nextPart` > 1, read the previous part first and cover **only what happened
since it** — each part continues the last one.

Use this structure. Omit a section only if it genuinely has nothing; never pad.

```markdown
# <Session topic> — part <N>

| | |
|---|---|
| Date | <YYYY-MM-DD> |
| Project | <project> (<repoRoot or cwd>) |
| Branch | <branch or —> |
| Session | <sessionId> |
| Covers | <what span of the session this part covers> |

## Goal
What the user set out to do, in their terms. Include how the goal changed, if it did.

## Outcome so far
3–6 bullets: what now works, what's verified, what isn't.

## Trail
Chronological. For each meaningful step: what was done, why, and the result.
Keep dead ends — a failed approach and why it failed is part of the trail.

## Methods & techniques
Approaches, commands, APIs, patterns or tools that worked and are reusable, with
the exact command or snippet where it helps.

## Bugs & fixes
For each problem hit:
- **Symptom:** exact error text or observed behaviour
- **Root cause:** what was actually wrong (or "unconfirmed" + best hypothesis)
- **Fix:** what changed, where (file:line when known)
- **Verified by:** how we know it's fixed (test, re-run, screenshot…), or "not verified"

## Decisions
Decision → reason → alternatives rejected. Include decisions the user made.

## Files & systems changed
Paths created/edited/deleted, settings/config changed, services, scheduled tasks,
repos, commits (short SHA + message). Say which are uncommitted.

## Open items & risks
Unfinished work, unverified assumptions, known issues, anything blocked or
waiting on the user.

## Next steps
Ordered, concrete, so the next session can start immediately.
```

Writing rules:

- Be specific: real names, paths, numbers, error strings, SHAs. No vague summaries.
- State verification honestly: "verified", "not verified", or "assumed".
- **Redact secrets**: never write API keys, tokens, passwords, private keys,
  connection strings with credentials, or personal data beyond what the repo
  already contains. Write `<redacted>` instead. Re-scan the file for `sk-`,
  `ghp_`, `AIza`, `Bearer `, `password`, `token` before saving.
- In a **public** repo, also leave out private absolute paths outside the repo
  and anything the user would not want published.

## Step 3 — Save

**`mode: local`** — write the file; done. Tell the user the full path.

**`mode: github`**:
1. Write the file into `targetDir`.
2. `git add` **only that file** and commit on the current branch:
   `docs(session): <topic> (part <N>)`. Don't stage anything else, even if the
   tree is dirty.
3. Push:
   - `visibility` is `private` or `internal` → `git push` (current branch).
   - `visibility` is `public` or `unknown` → **ask the user first**, showing the
     file path and a one-line summary; push only on a clear yes. If they say no,
     leave it committed locally and say so.
   - If the push fails (no upstream, rejected), report the error; don't force.
4. Tell the user: file path, commit SHA, pushed or not.

Never commit raw transcripts (`raw-precompact-*.jsonl`); they stay in the
Desktop folder.

## Step 4 — Report

One short message: where the file is, what part number, commit/push status, and
the location of the raw safety-net copies (`rawCopyDir`) if any exist.
