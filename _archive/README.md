# Archived code — `_archive/`

This folder contains **deprecated codebases** that have been retired but kept in-repo for reference, blame archaeology, and future feature ports.

## Contents

### `_archive/web/` — Next.js dashboard (retired 2026-05-09)

**What it was:** A Next.js 14 + Tailwind dashboard at the `/web/` subfolder of this repo. Built independently of the production marketing.inclufy.com app.

**Why it was archived:** Production marketing.inclufy.com lives in the separate sibling repo `Inclufy/inclufy-marketing-web` (Vite + React + shadcn). That repo is what users actually hit. This `/web/` dashboard was a parallel codebase that was never deployed and ended up duplicating only the basic CRUD pages plus a small set of new multi-agent governance features (Live Receipts, Caps, Counterfactual nudge, Approval flow, Goal Mode).

**Where the new features go:** Per [`docs/GAP_ANALYSIS_8092_VS_8082.md`](../docs/GAP_ANALYSIS_8092_VS_8082.md), the genuinely-new capabilities from this archived codebase are being ported into `inclufy-marketing-web` over Sprints +1 through +3. This archive folder is the **reference implementation** for those ports.

**Backend status:** All multi-agent backend (DB tables: `agents`, `agent_runs`, `agent_run_messages`, `agent_goals` + edge functions: `orchestrator`, `agent-ads`, `agent-counterfactual`) remains live on the shared Supabase project (`mpxkugfqzmxydxnlxqoj`). The archive only retires the React/Next.js UI layer.

**CI:** Build and typecheck jobs for `/web/` were removed from `.gitlab-ci.yml` and `.github/workflows/ci.yml`. Mobile (RN) typecheck still runs.

**To restore (if ever needed):**
```bash
git mv _archive/web web
# Re-add the typecheck:web / build-web jobs to the CI files
```

`git log --follow _archive/web/<file>` still works — `git mv` preserved the history.

## Companion docs

- `docs/GAP_ANALYSIS_8092_VS_8082.md` — full feature comparison and port roadmap.
- `docs/MULTI_AGENT_FEATURES.md` — backend/feature specification (still valid).
- `docs/GOAL_MODE_DESIGN.md` — Tier-2 design (still valid; mobile shipped, web port in progress).
