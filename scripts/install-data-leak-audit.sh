#!/usr/bin/env bash
# Install the data-leak audit infrastructure into another repo.
# Run from this repo's root:
#   ./scripts/install-data-leak-audit.sh ../target-repo
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <target-repo-path>" >&2
  exit 1
fi

TARGET="$(cd "$1" 2>/dev/null && pwd || true)"
SRC="$(cd "$(dirname "$0")/.." && pwd)"

if [ -z "$TARGET" ] || [ ! -d "$TARGET/.git" ]; then
  echo "✗ '$1' is not a git repository" >&2
  exit 1
fi
if [ "$TARGET" = "$SRC" ]; then
  echo "✗ target is the same repo as the source" >&2
  exit 1
fi

mkdir -p "$TARGET/scripts" "$TARGET/docs" "$TARGET/.claude/agents"

cp "$SRC/scripts/audit-data-leaks.mjs" "$TARGET/scripts/audit-data-leaks.mjs"
cp "$SRC/scripts/install-data-leak-audit.sh" "$TARGET/scripts/install-data-leak-audit.sh"
cp "$SRC/docs/data-leak-audit.md" "$TARGET/docs/data-leak-audit.md"
cp "$SRC/.claude/agents/data-leak-auditor.md" "$TARGET/.claude/agents/data-leak-auditor.md"
chmod +x "$TARGET/scripts/audit-data-leaks.mjs" "$TARGET/scripts/install-data-leak-audit.sh"

GI="$TARGET/.gitignore"
touch "$GI"
if ! grep -qxF '!.data-leak-baseline.json' "$GI"; then
  printf '\n# data-leak audit\n!.data-leak-baseline.json\n' >> "$GI"
fi
# Allow the auditor agent to be committed even when .claude/ is otherwise local-only
if grep -qxF '.claude/' "$GI" && ! grep -qxF '!.claude/agents/data-leak-auditor.md' "$GI"; then
  printf '!.claude/agents/\n!.claude/agents/data-leak-auditor.md\n' >> "$GI"
fi

cat <<EOF
✓ installed audit infra into $TARGET

Next steps:
  cd $TARGET
  # 1. Open scripts/audit-data-leaks.mjs and review the TABLES list
  #    (each repo has a different schema).
  # 2. Generate the baseline:
  node scripts/audit-data-leaks.mjs --write-baseline
  # 3. Commit:
  git add .claude/agents/data-leak-auditor.md scripts/audit-data-leaks.mjs \\
          scripts/install-data-leak-audit.sh \\
          docs/data-leak-audit.md .data-leak-baseline.json .gitignore
  git commit -m "chore: install data-leak audit infrastructure"
  # 4. Wire it into CI — see docs/data-leak-audit.md
EOF
