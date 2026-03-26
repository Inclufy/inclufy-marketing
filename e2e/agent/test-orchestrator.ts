#!/usr/bin/env npx tsx
/**
 * AMOS E2E Test Orchestrator
 *
 * Uses Maestro to drive the AMOS mobile app through its full flows,
 * and Claude to analyze screenshots, report issues, and gate publishing.
 *
 * Usage:
 *   npx tsx test-orchestrator.ts              # Run full test suite
 *   npx tsx test-orchestrator.ts --capture-only   # Only capture flows
 *   npx tsx test-orchestrator.ts --tabs-only      # Only tab navigation
 *   npx tsx test-orchestrator.ts --events-only    # Only event/campaign creation
 *   npx tsx test-orchestrator.ts --social-setup   # Only social channel setup
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import * as readline from 'readline';

// ─── Configuration ───────────────────────────────────────────────────────────

const PROJECT_ROOT = resolve(join(import.meta.dirname, '../..'));
const FLOWS_DIR = resolve(join(import.meta.dirname, '../maestro/flows'));
const MAESTRO_BIN = `${process.env.HOME}/.maestro/bin/maestro`;

// Ensure Java is available for Maestro
process.env.PATH = `/opt/homebrew/opt/openjdk/bin:${process.env.PATH}`;
const SCREENSHOT_DIR = resolve(join(import.meta.dirname, '../screenshots'));

// ─── Types ───────────────────────────────────────────────────────────────────

interface FlowResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  screenshots: string[];
}

interface TestReport {
  startTime: Date;
  endTime?: Date;
  flows: FlowResult[];
  totalPassed: number;
  totalFailed: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg: string) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[${ts}] ${msg}`);
}

function logSuccess(msg: string) {
  console.log(`\x1b[32m  ✓ ${msg}\x1b[0m`);
}

function logError(msg: string) {
  console.log(`\x1b[31m  ✗ ${msg}\x1b[0m`);
}

function logWarning(msg: string) {
  console.log(`\x1b[33m  ⚠ ${msg}\x1b[0m`);
}

function logSection(msg: string) {
  console.log(`\n\x1b[36m═══ ${msg} ═══\x1b[0m\n`);
}

/**
 * Ask the user a yes/no question in the terminal
 */
function askUser(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`\x1b[33m❓ ${question} (y/n): \x1b[0m`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

/**
 * Ask user for free text input
 */
function askUserInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`\x1b[33m❓ ${question}: \x1b[0m`, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Check prerequisites
 */
function checkPrerequisites(): boolean {
  log('Checking prerequisites...');

  // Check Maestro
  try {
    execSync(`${MAESTRO_BIN} --version`, { stdio: 'pipe' });
    logSuccess('Maestro CLI installed');
  } catch {
    logError('Maestro CLI not found. Install with: curl -Ls "https://get.maestro.mobile.dev" | bash');
    return false;
  }

  // Check iOS Simulator
  try {
    const devices = execSync('xcrun simctl list devices booted', { encoding: 'utf-8' });
    if (devices.includes('Booted')) {
      logSuccess('iOS Simulator is running');
    } else {
      logError('No booted iOS Simulator found. Start one first.');
      return false;
    }
  } catch {
    logError('xcrun simctl failed. Is Xcode installed?');
    return false;
  }

  // Check AMOS app installed
  try {
    const apps = execSync('xcrun simctl listapps booted 2>/dev/null | grep com.inclufy.go || true', {
      encoding: 'utf-8',
    });
    if (apps.includes('com.inclufy.go')) {
      logSuccess('AMOS app (com.inclufy.go) is installed on simulator');
    } else {
      logWarning('AMOS app may not be installed on simulator. Will try to launch anyway.');
    }
  } catch {
    logWarning('Could not verify AMOS app installation');
  }

  // Create screenshot dir
  execSync(`mkdir -p "${SCREENSHOT_DIR}"`);
  logSuccess(`Screenshots will be saved to: ${SCREENSHOT_DIR}`);

  return true;
}

/**
 * Run a single Maestro flow
 */
function runFlow(flowFile: string): FlowResult {
  const flowName = flowFile.replace('.yaml', '');
  const flowPath = join(FLOWS_DIR, flowFile);
  const startTime = Date.now();

  log(`Running flow: ${flowName}`);

  try {
    const output = execSync(
      `${MAESTRO_BIN} test "${flowPath}" --format junit --output "${SCREENSHOT_DIR}/${flowName}_report.xml" 2>&1`,
      {
        encoding: 'utf-8',
        timeout: 120_000, // 2 minute timeout per flow
        env: {
          ...process.env,
          MAESTRO_DRIVER_STARTUP_TIMEOUT: '30000',
        },
      },
    );

    const duration = Date.now() - startTime;

    // Collect screenshots
    const screenshots = collectScreenshots(flowName);

    logSuccess(`${flowName} passed (${(duration / 1000).toFixed(1)}s)`);

    return {
      name: flowName,
      success: true,
      duration,
      screenshots,
    };
  } catch (err: any) {
    const duration = Date.now() - startTime;
    const errorMsg = err.stdout || err.stderr || err.message || 'Unknown error';
    const screenshots = collectScreenshots(flowName);

    logError(`${flowName} failed (${(duration / 1000).toFixed(1)}s)`);
    logError(`  Error: ${errorMsg.slice(0, 200)}`);

    return {
      name: flowName,
      success: false,
      duration,
      error: errorMsg,
      screenshots,
    };
  }
}

/**
 * Collect screenshots generated by a flow
 */
function collectScreenshots(flowName: string): string[] {
  try {
    // Maestro saves screenshots in ~/.maestro/tests/ or in the specified output dir
    const screenshotDirs = [
      SCREENSHOT_DIR,
      join(process.env.HOME || '', '.maestro', 'tests'),
    ];

    const screenshots: string[] = [];
    for (const dir of screenshotDirs) {
      if (existsSync(dir)) {
        const files = readdirSync(dir)
          .filter((f) => f.startsWith(flowName.replace('flows/', '')) && f.endsWith('.png'))
          .map((f) => join(dir, f));
        screenshots.push(...files);
      }
    }
    return screenshots;
  } catch {
    return [];
  }
}

/**
 * Print test report
 */
function printReport(report: TestReport) {
  logSection('TEST REPORT');

  report.endTime = new Date();
  const totalDuration = report.endTime.getTime() - report.startTime.getTime();

  for (const flow of report.flows) {
    const status = flow.success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    const dur = (flow.duration / 1000).toFixed(1);
    console.log(`  ${status} ${flow.name} (${dur}s)`);
    if (flow.error) {
      console.log(`    \x1b[31m└─ ${flow.error.slice(0, 150)}\x1b[0m`);
    }
    if (flow.screenshots.length > 0) {
      console.log(`    └─ ${flow.screenshots.length} screenshot(s)`);
    }
  }

  console.log('');
  console.log(`  Total:  ${report.flows.length} flows`);
  console.log(`  Passed: \x1b[32m${report.totalPassed}\x1b[0m`);
  console.log(`  Failed: \x1b[31m${report.totalFailed}\x1b[0m`);
  console.log(`  Time:   ${(totalDuration / 1000).toFixed(1)}s`);
  console.log('');
}

// ─── Test Suites ─────────────────────────────────────────────────────────────

async function runTabsTest(report: TestReport) {
  logSection('TAB NAVIGATION TEST');
  const result = runFlow('test-all-tabs.yaml');
  report.flows.push(result);
  result.success ? report.totalPassed++ : report.totalFailed++;
}

async function runEventCreation(report: TestReport) {
  logSection('EVENT & CAMPAIGN CREATION');

  const createEvent = await askUser('Create a test event?');
  if (createEvent) {
    const result = runFlow('create-event.yaml');
    report.flows.push(result);
    result.success ? report.totalPassed++ : report.totalFailed++;
  }

  const createCampaign = await askUser('Create a test campaign?');
  if (createCampaign) {
    const result = runFlow('create-campaign.yaml');
    report.flows.push(result);
    result.success ? report.totalPassed++ : report.totalFailed++;
  }
}

async function runCaptureTests(report: TestReport) {
  logSection('CAPTURE FLOWS');

  const categories = [
    { file: 'capture-event.yaml', label: 'Event Capture' },
    { file: 'capture-product.yaml', label: 'Product Capture' },
    { file: 'capture-inspiration.yaml', label: 'Inspiration Capture' },
    { file: 'capture-behind-scenes.yaml', label: 'Behind the Scenes Capture' },
  ];

  for (const cat of categories) {
    log(`\nStarting: ${cat.label}`);

    const proceed = await askUser(`Run ${cat.label}?`);
    if (!proceed) {
      logWarning(`Skipped: ${cat.label}`);
      continue;
    }

    const result = runFlow(cat.file);
    report.flows.push(result);

    if (result.success) {
      report.totalPassed++;
      log(`${cat.label} completed — post is on review screen.`);

      // Run review flow
      const reviewResult = runFlow('review-post.yaml');
      report.flows.push(reviewResult);
      reviewResult.success ? report.totalPassed++ : report.totalFailed++;

      // ═══ PUBLISH GATE ═══
      console.log('\n\x1b[33m' + '═'.repeat(60) + '\x1b[0m');
      console.log('\x1b[33m  PUBLISH GATE — Review the screenshots above\x1b[0m');
      console.log('\x1b[33m  Channel: LinkedIn, Instagram (default channels)\x1b[0m');
      console.log('\x1b[33m  Category: ' + cat.label + '\x1b[0m');
      console.log('\x1b[33m' + '═'.repeat(60) + '\x1b[0m\n');

      const shouldPublish = await askUser(
        `PUBLISH these ${cat.label} posts to the connected channels? This is IRREVERSIBLE.`,
      );

      if (shouldPublish) {
        const confirmAgain = await askUser('Are you SURE you want to publish? Type y to confirm.');
        if (confirmAgain) {
          const publishResult = runFlow('publish-post.yaml');
          report.flows.push(publishResult);
          publishResult.success ? report.totalPassed++ : report.totalFailed++;
          logSuccess(`Published ${cat.label} posts`);
        } else {
          logWarning('Publish cancelled on second confirmation');
        }
      } else {
        logWarning(`Publish skipped for ${cat.label} — posts remain as drafts`);
      }
    } else {
      report.totalFailed++;
      logError(`${cat.label} failed — check screenshots for details`);

      const continueTests = await askUser('Continue with remaining capture tests?');
      if (!continueTests) break;
    }

    // Navigate back to home for next capture
    try {
      execSync(
        `${MAESTRO_BIN} test -e "appId: com.inclufy.go\n---\n- tapOn: Dashboard\n- waitForAnimationToEnd" 2>&1`,
        { timeout: 15000 },
      );
    } catch {
      // Best effort navigation back
    }
  }
}

async function runSocialSetup(report: TestReport) {
  logSection('SOCIAL CHANNEL SETUP');

  const channels = [
    { file: 'setup-linkedin.yaml', label: 'LinkedIn' },
    { file: 'setup-instagram.yaml', label: 'Instagram' },
    { file: 'setup-facebook.yaml', label: 'Facebook' },
  ];

  for (const ch of channels) {
    const proceed = await askUser(`Set up ${ch.label} account?`);
    if (!proceed) {
      logWarning(`Skipped: ${ch.label}`);
      continue;
    }

    log(`Starting ${ch.label} setup — this will open a browser for OAuth.`);
    log('You may need to log in manually in the browser window.');

    const result = runFlow(ch.file);
    report.flows.push(result);
    result.success ? report.totalPassed++ : report.totalFailed++;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n\x1b[36m' + '═'.repeat(60) + '\x1b[0m');
  console.log('\x1b[36m  AMOS E2E Test Agent — Powered by Maestro + Claude\x1b[0m');
  console.log('\x1b[36m' + '═'.repeat(60) + '\x1b[0m\n');

  // Parse args
  const args = process.argv.slice(2);
  const captureOnly = args.includes('--capture-only');
  const tabsOnly = args.includes('--tabs-only');
  const eventsOnly = args.includes('--events-only');
  const socialSetup = args.includes('--social-setup');
  const runAll = !captureOnly && !tabsOnly && !eventsOnly && !socialSetup;

  // Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1);
  }

  const report: TestReport = {
    startTime: new Date(),
    flows: [],
    totalPassed: 0,
    totalFailed: 0,
  };

  try {
    // 1. Launch app
    logSection('LAUNCHING AMOS');
    const launchResult = runFlow('launch.yaml');
    report.flows.push(launchResult);
    if (launchResult.success) {
      report.totalPassed++;
    } else {
      report.totalFailed++;
      logError('App launch failed — cannot continue');
      printReport(report);
      process.exit(1);
    }

    // 2. Tab navigation test
    if (runAll || tabsOnly) {
      await runTabsTest(report);
    }

    // 3. Event & Campaign creation
    if (runAll || eventsOnly) {
      await runEventCreation(report);
    }

    // 4. Capture flows (the main test)
    if (runAll || captureOnly) {
      await runCaptureTests(report);
    }

    // 5. Social channel setup
    if (runAll || socialSetup) {
      await runSocialSetup(report);
    }
  } catch (err: any) {
    logError(`Unexpected error: ${err.message}`);
  }

  // Print final report
  printReport(report);

  // Exit code
  process.exit(report.totalFailed > 0 ? 1 : 0);
}

main();
