# session-snapshot

A Claude Code skill that saves the full working trail of a session — goal, what
was tried, methods, bugs with root cause and fix, decisions, files changed, open
items, next steps — to a Markdown file **before context compaction loses it**.

```
/session-snapshot
```

Snapshots are **always local and private**: every project, public repo, private
repo or no repo at all. They are never written inside a repo, never committed and
never pushed.

| Sessions folder (first that applies) | Snapshot path |
|---|---|
| `CLAUDE_SESSIONS_DIR` environment variable | `<folder>\<date>_<project>_<session>\part-NN_<topic>.md` |
| `D:.Claude Sessions`, if it exists | same layout |
| `Desktop\Claude Sessions` | same layout |

Run it again later in the same session and it writes `part-02`, `part-03`, …,
each covering what happened since the previous part.

## The automatic safety net

A `PreCompact` hook copies the **raw** conversation log into the same local
session folder right before Claude Code compacts, whether you triggered `/compact` or it
happened automatically. So the trail survives even if you forgot to run the skill.

Raw copies are unedited and can contain secrets that appeared in tool output.
Like the write-ups, they stay on your PC. The skill still redacts keys and tokens
from the write-ups, so they are safe to share by hand if you choose to.

## Install (Windows; terminal and desktop app)

Requires Node.js 18+. Git is optional (used only to read the repo name and branch).

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

On macOS/Linux the same works: the fallback is `~/Desktop/Claude Sessions`.

## Files

| File | Role |
|---|---|
| `SKILL.md` | What Claude writes, the section template, redaction and local-only rules |
| `scripts/locate.js` | Works out session id, repo root / branch, the local target folder and next part number, and prints them as JSON, so the skill never guesses paths |
| `scripts/precompact-hook.js` | The `PreCompact` safety net. Never blocks compaction (always exits 0) |

## Relationship to claude-mem

[claude-mem](https://github.com/thedotmack/claude-mem) keeps short memories
*for Claude* and injects them into later sessions automatically.
session-snapshot writes a record *for you*: readable, and kept privately on
your own PC. They work well together.

## License

MIT
