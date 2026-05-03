#!/usr/bin/env node
// Baseline-aware secret + PII audit. Scans tracked files for hardcoded
// credentials, JWTs, OAuth secrets, production project refs, env-fallback
// anti-patterns, and seed-file rows that look like real customer data.
//
// Usage:
//   node scripts/audit-data-leaks.mjs              # exit 1 on new findings
//   node scripts/audit-data-leaks.mjs --write-baseline  # accept current state
//   node scripts/audit-data-leaks.mjs --json       # machine-readable output

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { argv, exit, cwd } from 'node:process';

// Tables whose rows in seed/migration files would indicate a prod-data leak.
// REVIEW THIS LIST when installing in a new repo — schemas differ.
const TABLES = [
  'users',
  'profiles',
  'auth.users',
  'organizations',
  'contacts',
  'subscribers',
  'leads',
  'go_organization',
  'go_user',
  'go_contact',
  'email_subscribers',
];

const PATTERNS = [
  { id: 'jwt', re: /eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}/g, severity: 'critical', desc: 'JWT (likely Supabase service_role/anon)' },
  { id: 'stripe-live', re: /sk_live_[A-Za-z0-9]{20,}/g, severity: 'critical', desc: 'Stripe live secret key' },
  { id: 'stripe-test', re: /sk_test_[A-Za-z0-9]{20,}/g, severity: 'high', desc: 'Stripe test secret key' },
  { id: 'aws-access', re: /AKIA[A-Z0-9]{16}/g, severity: 'critical', desc: 'AWS access key id' },
  { id: 'github-token', re: /gh[pousr]_[A-Za-z0-9]{30,}/g, severity: 'critical', desc: 'GitHub token' },
  { id: 'google-api', re: /AIza[A-Za-z0-9_\-]{35}/g, severity: 'critical', desc: 'Google API key' },
  { id: 'slack-token', re: /xox[baprs]-[A-Za-z0-9\-]{10,}/g, severity: 'critical', desc: 'Slack token' },
  { id: 'openai-key', re: /sk-[A-Za-z0-9]{40,}/g, severity: 'critical', desc: 'OpenAI/Anthropic-shaped key' },
  { id: 'private-key', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g, severity: 'critical', desc: 'Private key block' },
  { id: 'db-url-with-creds', re: /(?:postgres|postgresql|mysql|mongodb)(?:\+srv)?:\/\/[^\s:'"`]+:[^@\s'"`]+@[^\s'"`]+/g, severity: 'critical', desc: 'DB connection string with embedded password' },
  { id: 'supabase-ref', re: /https:\/\/[a-z0-9]{20}\.supabase\.co/g, severity: 'medium', desc: 'Hardcoded Supabase project URL' },
  { id: 'env-fallback', re: /process\.env\.[A-Z_]+\s*\|\|\s*['"`]https?:\/\/(?!placeholder|example|localhost)[^'"`]+['"`]/g, severity: 'medium', desc: 'process.env.X || <real-url> fallback anti-pattern' },
];

const EXCLUDE_PATH_SEGMENTS = [
  '/node_modules/',
  '/.git/',
  '/ios/',
  '/.next/',
  '/dist/',
  '/web-build/',
  '/venv/',
  '/venv_test/',
  '/__pycache__/',
];

const EXCLUDE_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.data-leak-baseline.json',
]);

const BINARY_EXT = /\.(png|jpe?g|gif|webp|svg|ico|pdf|aab|jks|p8|p12|pem|key|woff2?|ttf|otf|mp[34]|zip|gz|tgz)$/i;

function trackedFiles() {
  const out = execSync('git ls-files', { encoding: 'utf8', cwd: cwd() });
  return out
    .split('\n')
    .filter(Boolean)
    .filter((f) => !EXCLUDE_PATH_SEGMENTS.some((s) => ('/' + f).includes(s)))
    .filter((f) => !EXCLUDE_FILES.has(f.split('/').pop()))
    .filter((f) => !BINARY_EXT.test(f));
}

function scan() {
  const findings = [];
  for (const file of trackedFiles()) {
    let body;
    try {
      if (statSync(file).size > 2_000_000) continue;
      body = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (file === '.env.example') continue;

    for (const { id, re, severity, desc } of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(body))) {
        const line = body.slice(0, m.index).split('\n').length;
        findings.push({
          id,
          severity,
          desc,
          file,
          line,
          match: m[0].length > 80 ? m[0].slice(0, 77) + '...' : m[0],
        });
      }
    }

    if (/\.sql$/i.test(file)) {
      const emailRe = /[A-Za-z0-9._%+-]+@(?!example\.|test\.|localhost|inclufy\.local)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
      for (const t of TABLES) {
        if (!new RegExp(`\\b${t.replace('.', '\\.')}\\b`, 'i').test(body)) continue;
        emailRe.lastIndex = 0;
        let m;
        while ((m = emailRe.exec(body))) {
          const line = body.slice(0, m.index).split('\n').length;
          findings.push({
            id: 'pii-email',
            severity: 'high',
            desc: `email near table "${t}" — possible prod data in seed/migration`,
            file,
            line,
            match: m[0],
          });
        }
      }
    }
  }
  return findings;
}

function fingerprint(f) {
  return `${f.id}|${f.file}|${f.match}`;
}

const args = new Set(argv.slice(2));
const writeBaseline = args.has('--write-baseline');
const jsonOut = args.has('--json');
const baselinePath = '.data-leak-baseline.json';

const findings = scan();
const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, 'utf8'))
  : { fingerprints: [] };

if (writeBaseline) {
  const fps = [...new Set(findings.map(fingerprint))].sort();
  writeFileSync(
    baselinePath,
    JSON.stringify({ generated: new Date().toISOString().slice(0, 10), fingerprints: fps }, null, 2) + '\n',
  );
  console.log(`wrote ${baselinePath}: ${fps.length} known fingerprint(s)`);
  exit(0);
}

const known = new Set(baseline.fingerprints);
const novel = findings.filter((f) => !known.has(fingerprint(f)));

if (jsonOut) {
  console.log(JSON.stringify({ findings, novel }, null, 2));
  exit(novel.length === 0 ? 0 : 1);
}

if (novel.length === 0) {
  console.log(`ok: 0 new findings (${findings.length} known, baseline ${baselinePath})`);
  exit(0);
}

const order = { critical: 0, high: 1, medium: 2, low: 3 };
novel.sort((a, b) => (order[a.severity] - order[b.severity]) || a.file.localeCompare(b.file));

console.error(`\n${novel.length} new leak(s) detected:\n`);
for (const f of novel) {
  console.error(`  [${f.severity}] ${f.file}:${f.line}  ${f.id}`);
  console.error(`    ${f.desc}`);
  console.error(`    match: ${f.match}`);
}
console.error(
  `\nFix each finding, or — if intentional — run \`node scripts/audit-data-leaks.mjs --write-baseline\` and commit the updated baseline.`,
);
exit(1);
