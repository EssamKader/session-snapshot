# session-snapshot

A Claude Code skill that saves the full working trail of a session — goal, what
was tried, methods, bugs with root cause and fix, decisions, files changed, open
items, next steps — to a Markdown file **before context compaction loses it**.

```
/session-snapshot
```

| Where you're working | Where the snapshot goes | Git |
|---|---|---|
| A GitHub repo | `docs/sessions/<date>_<project>_<session>/part-NN_<topic>.md` | Committed. Private repos are pushed; **public repos ask first** |
| Anywhere else | `Desktop\Claude Sessions\<date>_<project>_<session>\part-NN_<topic>.md` | — |

Run it again later in the same session and it writes `part-02`, `part-03`, …,
each covering what happened since the previous part.

## The automatic safety net

A `PreCompact` hook copies the **raw** conversation log to the Desktop session
folder right before Claude Code compacts, whether you triggered `/compact` or it
happened automatically. So the trail survives even if you forgot to run the skill.

Raw copies are unedited and can contain secrets that appeared in tool output, so
they **only ever go to the Desktop folder, never into a repo**. The skill itself
redacts keys and tokens from the write-ups it commits.

## Install (Windows; terminal and desktop app)

Requires Node.js 18+, Git, and the GitHub CLI (`gh`, logged in) for repo
visibility checks.

1. Copy the skill:

   ```powershell
   git clone https://github.com/EssamKader/session-snapshot.git "$env:USERPROFILE\.claude\skills\session-snapshot"
   ```

2. Register the safety-net hook in `~/.claude/settings.json` (merge into any
   existing `hooks` object; replace `<you>` with your Windows user name):

   ```json
   {
     "hooks": {
       "PreCompact": [
         {
           "matcher": "",
           "hooks": [
             {
               "type": "command",
               "command": "node \"C:/Users/<you>/.claude/skills/session-snapshot/scripts/precompact-hook.js\"",
               "timeout": 60
             }
           ]
         }
       ]
     }
   }
   ```

3. Start a new session. `~/.claude/skills` and `~/.claude/settings.json` are
   shared by the Claude Code terminal and the Claude desktop app, so both get
   the skill and the hook.

On macOS/Linux the same works: Desktop resolves to `~/Desktop`.

## Files

| File | Role |
|---|---|
| `SKILL.md` | What Claude writes, the section template, redaction and git rules |
| `scripts/locate.js` | Works out session id, repo root / visibility / branch, target folder and next part number, and prints them as JSON, so the skill never guesses paths |
| `scripts/precompact-hook.js` | The `PreCompact` safety net. Never blocks compaction (always exits 0) |

## Relationship to claude-mem

[claude-mem](https://github.com/thedotmack/claude-mem) keeps short memories
*for Claude* and injects them into later sessions automatically.
session-snapshot writes a record *for you*: readable, shareable, and stored
next to the code it describes. They work well together.

## License

MIT
