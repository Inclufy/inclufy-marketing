#!/usr/bin/env node
// scripts/validate-manual.js
//
// Anti-hallucination guard for APP_MANUAL in scanning-agent.service.ts.
//
// For every entry in APP_MANUAL it verifies:
//   1. The screen file (src/screens/<screen>.tsx) actually exists.
//   2. Every function listed under `functions[]` appears somewhere in that file
//      (as an identifier — handles const handleX, async handleX, function handleX,
//      named JSX props like onPress={handleX}, and descriptive strings like
//      "Pull-to-refresh" that map to patterns).
//
// Functions with purely descriptive names (no camelCase identifier, e.g.
// "Pull-to-refresh", "Terms link") are skipped from the grep check — they
// document UI behaviour rather than a named handler.
//
// Exit code 0 = all good.  Exit code 1 = one or more violations found.
// Run with: node scripts/validate-manual.js  (or npm run validate:manual)

const fs   = require('fs');
const path = require('path');

// ─── Parse APP_MANUAL out of the service file ─────────────────────────────────
// We do a lightweight text extraction rather than importing the module, so this
// script works without a TypeScript compile step.

const ROOT         = path.resolve(__dirname, '..');
const SERVICE_FILE = path.join(ROOT, 'src', 'services', 'scanning-agent.service.ts');
const SCREENS_DIR  = path.join(ROOT, 'src', 'screens');

// Reads the service file and extracts every { screen: '...', functions: [...] } block.
// Returns an array of { screen, functions: [{name}] }
function parseManual(source) {
  const entries = [];

  // Match each ManualScreen object block by finding screen: '...' and then its functions array
  const screenRe = /screen:\s*'([^']+)'/g;
  let m;
  while ((m = screenRe.exec(source)) !== null) {
    const screenName = m[1];
    // Find the start of the functions array after this screen declaration
    const afterPos = m.index + m[0].length;
    const funcArrayStart = source.indexOf('functions:', afterPos);
    if (funcArrayStart === -1 || funcArrayStart - afterPos > 500) continue;

    // Extract the content of the functions array (from '[' to matching ']')
    const bracketStart = source.indexOf('[', funcArrayStart);
    if (bracketStart === -1) continue;

    let depth = 0;
    let i = bracketStart;
    while (i < source.length) {
      if (source[i] === '[' || source[i] === '{') depth++;
      else if (source[i] === ']' || source[i] === '}') depth--;
      if (depth === 0) break;
      i++;
    }
    const funcBlock = source.slice(bracketStart, i + 1);

    // Pull every name: '...' from the functions block
    const names = [];
    const nameRe = /name:\s*'([^']+)'/g;
    let nm;
    while ((nm = nameRe.exec(funcBlock)) !== null) {
      names.push(nm[1]);
    }

    entries.push({ screen: screenName, functions: names });
  }
  return entries;
}

// ─── Determine if a function name is a code identifier ────────────────────────
// camelCase / PascalCase identifiers → check in source.
// Descriptive phrases ("Pull-to-refresh", "Terms link") → skip grep check.
function isCodeIdentifier(name) {
  // Must start with a lowercase or uppercase letter and contain no spaces
  // Allowed: handleX, onRefresh, sendMessage, addLuxuryIcons, handleToggleAudio
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

// ─── Check a name appears in the file ────────────────────────────────────────
function nameExistsInFile(name, fileSource) {
  // Matches: const name, async name, function name, name(, name =, as a JSX attribute
  const patterns = [
    new RegExp(`\\b${name}\\b`),
  ];
  return patterns.some(re => re.test(fileSource));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(SERVICE_FILE)) {
    console.error(`[validate-manual] Service file not found: ${SERVICE_FILE}`);
    process.exit(1);
  }

  const serviceSource = fs.readFileSync(SERVICE_FILE, 'utf8');
  const manual = parseManual(serviceSource);

  if (manual.length === 0) {
    console.error('[validate-manual] Could not parse any entries from APP_MANUAL. Check the service file.');
    process.exit(1);
  }

  let errors = 0;
  let warnings = 0;
  const lines = [];

  for (const entry of manual) {
    const screenFile = path.join(SCREENS_DIR, `${entry.screen}.tsx`);
    const fileExists = fs.existsSync(screenFile);

    if (!fileExists) {
      lines.push(`  ✗ [MISSING FILE] ${entry.screen}.tsx`);
      errors++;
      continue;
    }

    const screenSource = fs.readFileSync(screenFile, 'utf8');

    for (const fnName of entry.functions) {
      if (!isCodeIdentifier(fnName)) continue; // descriptive phrase, skip

      if (!nameExistsInFile(fnName, screenSource)) {
        lines.push(`  ✗ [MISSING FN]   ${entry.screen}.tsx → '${fnName}' not found in source`);
        errors++;
      }
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const screenCount = manual.length;
  const fnCount     = manual.reduce((n, e) => n + e.functions.length, 0);
  const checkedFns  = manual.reduce(
    (n, e) => n + e.functions.filter(f => isCodeIdentifier(f)).length,
    0
  );

  console.log(`\n[validate-manual] APP_MANUAL validation`);
  console.log(`  Screens checked : ${screenCount}`);
  console.log(`  Functions total : ${fnCount}  (${checkedFns} identifier checks, ${fnCount - checkedFns} descriptive skipped)`);

  if (errors === 0) {
    console.log(`  Result          : ✅  All checks passed — no hallucinations detected.\n`);
    process.exit(0);
  } else {
    console.log(`  Result          : ❌  ${errors} violation(s) found:\n`);
    lines.forEach(l => console.log(l));
    console.log('\n  Fix these entries in APP_MANUAL (scanning-agent.service.ts) before committing.\n');
    process.exit(1);
  }
}

main();
