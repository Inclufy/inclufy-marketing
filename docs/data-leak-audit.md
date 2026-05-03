# Data-leak audit

Baseline-aware scanner for hardcoded credentials, JWTs, OAuth secrets,
production project refs, env-fallback anti-patterns, and seed-file PII.
Greps tracked files only; ignores `node_modules`, `ios/`, build outputs,
binaries, and lock files.

## Run locally

```bash
node scripts/audit-data-leaks.mjs                 # exits 1 if new findings
node scripts/audit-data-leaks.mjs --json          # machine-readable
node scripts/audit-data-leaks.mjs --write-baseline  # accept current state
```

The committed baseline at `.data-leak-baseline.json` records fingerprints
of every known/accepted finding. The audit only fails on **new** findings.

## What it detects

| id                  | severity  | what                                                |
|---------------------|-----------|-----------------------------------------------------|
| `jwt`               | critical  | `eyJ...` JWTs (Supabase service_role / anon)        |
| `stripe-live`       | critical  | `sk_live_*` keys                                    |
| `stripe-test`       | high      | `sk_test_*` keys                                    |
| `aws-access`        | critical  | `AKIA...` access key ids                            |
| `github-token`      | critical  | `ghp_/gho_/ghs_/ghu_/ghr_` tokens                   |
| `google-api`        | critical  | `AIza...` keys                                      |
| `slack-token`       | critical  | `xoxb-/xoxp-/xoxa-/xoxr-/xoxs-` tokens              |
| `openai-key`        | critical  | `sk-` prefixed long keys                            |
| `private-key`       | critical  | `-----BEGIN ... PRIVATE KEY-----` blocks            |
| `db-url-with-creds` | critical  | `postgres://user:pass@host` style URLs              |
| `supabase-ref`      | medium    | hardcoded `https://<projectref>.supabase.co`        |
| `env-fallback`      | medium    | `process.env.X \|\| 'https://real-url'` anti-pattern |
| `pii-email`         | high      | real-looking emails near sensitive tables in `.sql` |

## Update the TABLES list

`pii-email` flags emails inside `.sql` files that also reference a name from
the `TABLES` array in `scripts/audit-data-leaks.mjs`. Each repo has a
different schema, so when you install this in a new repo, edit that array
to match the actual sensitive tables.

## CI

### GitHub Actions

```yaml
# .github/workflows/data-leak-audit.yml
name: data-leak-audit
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: node scripts/audit-data-leaks.mjs
```

### GitLab CI

```yaml
# add to .gitlab-ci.yml
data-leak-audit:
  stage: validate
  image: node:20
  script:
    - node scripts/audit-data-leaks.mjs
  only:
    - main
    - merge_requests
```

## Workflow when a new finding appears

1. Run `node scripts/audit-data-leaks.mjs` — it lists each new finding
   with file:line, severity, and the matched fragment.
2. **Real leak** → fix in place:
   - Hardcoded URL/JWT in source → replace with `process.env.X` and throw on missing.
   - CI variable hardcoded → move to GitLab/GitHub-managed CI variables.
   - `process.env.X || 'real-url'` → drop the fallback or use a clearly fake placeholder.
   - Tracked secret file → `git rm --cached`, add to `.gitignore`.
   - Real secret committed → fix + **rotate** the credential in the provider dashboard.
3. **False positive / intentional** (e.g., placeholder in a fixture) →
   `node scripts/audit-data-leaks.mjs --write-baseline` and commit
   `.data-leak-baseline.json` with a one-line reason in the message.

## Installing in another repo

From this repo's root:

```bash
./scripts/install-data-leak-audit.sh ../inclufy-academy
```

Then in the target repo, review the `TABLES` list, write the baseline,
commit, and add the CI snippet above.
