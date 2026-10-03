---
name: session-snapshot
description: Save the current session's full working trail — goal, what was tried, methods, bugs with root cause and fix, decisions, files changed, open items, next steps — to a Markdown file before context compaction loses it. Always local and private — <sessions folder>\<date>_<project>_<session>\ (D:\05.Claude Sessions if it exists, else Desktop\Claude Sessions, or CLAUDE_SESSIONS_DIR) — for every project, public or private repo or no repo; never written into a repo, never committed, never pushed. Repeat runs add part-02, part-03…. Use when the user runs /session-snapshot, asks to save/snapshot/record the session or context, says context is getting long, or is about to /compact or stop for the day.
---

# Session snapshot

Write a faithful, readable record of **this session so far** so nothing important
is lost when the conversation is compacted or closed. The reader is the user (and
future sessions) coming back cold: they must be able to understand what happened,
why, and what to do next, without the chat.

A `PreCompact` hook (`scripts/precompact-hook.js`) separately saves a raw copy of
the transcript to the same local folder automatically before any compaction.
That raw copy is a safety net; this skill produces the real write-up.

## Step 1 — Locate

Run the helper from the session's working directory and read its JSON:

```bash
node ~/.claude/skills/session-snapshot/scripts/locate.js "<current working directory>"
```

It returns `targetDir`, `nextPart`, `project`, `sessionId`, `repoRoot`, `branch`
and `rawCopyDir`. Use these values as given; don't invent paths.

**Snapshots are always local and private** (user rule, 2026-10-03). `targetDir` is
always `<sessions folder>\<date>_<project>_<session8>\`, where the sessions folder is
`CLAUDE_SESSIONS_DIR`, else `D:\05.Claude Sessions` if it exists, else
`Desktop\Claude Sessions`. Same rule whatever the repo: public, private, internal or none.
Never write a snapshot inside a repo, never `git add` / commit / push it, never
upload it to GitHub (issues, gists, PRs, wikis) or any other cloud service.

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

## Step 3 — Save

Write the file into `targetDir`. That's all: no git, no push, no upload. If the
working tree has older snapshots under `docs/sessions/`, leave them; don't touch
the repo from this skill.

Raw transcripts (`raw-precompact-*.jsonl`) sit in the same local folder.

## Step 4 — Report

One short message: the full path of the file, the part number, and that it is
local only (not committed, not pushed).
