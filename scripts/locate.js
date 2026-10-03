#!/usr/bin/env node
// Prints everything /session-snapshot needs to decide where to write, as JSON:
// session id + transcript, project, git repo root / remote / branch,
// the local target folder and the next part number. Snapshots are ALWAYS local (never in a repo,
// never committed or pushed), whatever the repo's visibility.
//
// Usage: node locate.js [cwd] [transcript.jsonl]
//   cwd defaults to process.cwd(); pass the transcript when known (the PreCompact hook does),
//   otherwise the most recently modified transcript for cwd is assumed to be the current session.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const cwd = path.resolve(process.argv[2] || process.cwd());
const givenTranscript = process.argv[3] && fs.existsSync(process.argv[3]) ? path.resolve(process.argv[3]) : null;
const HOME = os.homedir();
const PROJECTS = path.join(HOME, '.claude', 'projects');

const run = (cmd, args, opts = {}) => {
  try { return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000, ...opts }).trim(); }
  catch { return null; }
};

// Claude Code stores each project's transcripts in ~/.claude/projects/<cwd with every non-alphanumeric char -> '-'>
function projectDirFor(dir) {
  const encoded = dir.replace(/[^A-Za-z0-9]/g, '-');
  const exact = path.join(PROJECTS, encoded);
  if (fs.existsSync(exact)) return exact;
  // fall back to case-insensitive match
  try {
    const hit = fs.readdirSync(PROJECTS).find((d) => d.toLowerCase() === encoded.toLowerCase());
    return hit ? path.join(PROJECTS, hit) : null;
  } catch { return null; }
}

function currentTranscript(dir) {
  const pdir = projectDirFor(dir);
  if (!pdir) return null;
  const files = fs.readdirSync(pdir).filter((f) => f.endsWith('.jsonl'))
    .map((f) => ({ f: path.join(pdir, f), t: fs.statSync(path.join(pdir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  return files[0]?.f || null; // the session being written right now is the most recently modified
}

// Root for all local snapshots and raw copies. Override with CLAUDE_SESSIONS_DIR.
const SESSIONS_ROOT = process.env.CLAUDE_SESSIONS_DIR || 'D:\\05.Claude Sessions';

function slug(s, n = 40) {
  return String(s).normalize('NFKD').replace(/[^\w\s.-]/g, '').trim().replace(/[\s.]+/g, '-').slice(0, n).replace(/-+$/, '') || 'session';
}

function nextPart(dir) {
  if (!fs.existsSync(dir)) return 1;
  const nums = fs.readdirSync(dir).map((f) => /^part-(\d+)/.exec(f)).filter(Boolean).map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) + 1 : 1;
}

const transcript = givenTranscript || currentTranscript(cwd);
const sessionId = transcript ? path.basename(transcript, '.jsonl') : null;
let startedAt = null;
if (transcript) {
  try {
    const fd = fs.openSync(transcript, 'r'); const buf = Buffer.alloc(64 * 1024);
    const n = fs.readSync(fd, buf, 0, buf.length, 0); fs.closeSync(fd);
    for (const line of buf.toString('utf8', 0, n).split('\n')) { try { const o = JSON.parse(line); if (o.timestamp) { startedAt = o.timestamp; break; } } catch {} }
  } catch {}
}
const date = (startedAt || new Date().toISOString()).slice(0, 10);

const repoRoot = run('git', ['rev-parse', '--show-toplevel']);
const remote = repoRoot ? run('git', ['remote', 'get-url', 'origin']) : null;
const branch = repoRoot ? run('git', ['rev-parse', '--abbrev-ref', 'HEAD']) : null;
const project = path.basename(repoRoot || cwd);
const sessionFolder = `${date}_${slug(project)}_${(sessionId || 'nosession').slice(0, 8)}`;

// Every snapshot stays on this PC: one folder per conversation, next to the raw copies.
// Nothing is written inside the repo, so nothing can be committed or pushed.
const targetDir = path.join(SESSIONS_ROOT, sessionFolder);

console.log(JSON.stringify({
  cwd,
  project,
  sessionId,
  transcript,
  startedAt,
  mode: 'local',       // always local; kept for older callers
  repoRoot,
  remote,
  branch,
  targetDir,
  rawCopyDir: targetDir, // raw transcripts sit next to the write-ups, never in a repo
  nextPart: nextPart(targetDir),
}, null, 2));
