#!/usr/bin/env node
// PreCompact hook for /session-snapshot — the automatic safety net.
// Claude Code runs this right before compacting a conversation (manual /compact or auto).
// It copies the raw session transcript to D:\05.Claude Sessions\<session folder>\ so the full
// trail survives compaction even if /session-snapshot was never run.
// Raw copies may contain secrets, so they ONLY ever go to that local folder — never into a repo.
//
// Input (stdin JSON from Claude Code): { session_id, transcript_path, cwd, trigger: "manual"|"auto", ... }
// Never blocks compaction: always exits 0.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw || '{}');
    const transcript = input.transcript_path;
    if (!transcript || !fs.existsSync(transcript)) return;

    const cwd = input.cwd || process.cwd();
    const locate = path.join(__dirname, 'locate.js');
    const info = JSON.parse(execFileSync(process.execPath, [locate, cwd, transcript], { encoding: 'utf8', timeout: 30000 }));

    const dir = info.rawCopyDir;
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dest = path.join(dir, `raw-precompact-${input.trigger || 'unknown'}-${stamp}.jsonl`);
    fs.copyFileSync(transcript, dest);

    const readme = path.join(dir, 'README.txt');
    if (!fs.existsSync(readme)) {
      fs.writeFileSync(readme,
        'raw-precompact-*.jsonl = full, unedited Claude Code conversation log saved automatically right before\n' +
        'the conversation was compacted. It can contain secrets (API keys, passwords shown in tool output).\n' +
        'Keep it local. Do not commit or share it. The clean write-ups are the part-NN_*.md files.\n');
    }
  } catch (e) {
    try { process.stderr.write(`session-snapshot precompact hook: ${e.message}\n`); } catch {}
  } finally {
    process.exit(0);
  }
});
