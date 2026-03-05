#!/usr/bin/env node

/**
 * @everystate/types CLI - opt-in self-test
 *
 * Usage:
 *   npx everystate-types-self-test          # run self-test
 *   npx everystate-types-self-test --help   # show help
 */

(async () => {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
@everystate/types - self-test CLI

Usage:
  everystate-types-self-test          Run the bundled self-test
  everystate-types-self-test --help   Show this help message

The self-test verifies that createTypedStore and typed work
correctly at runtime. It checks the full store API surface
(get, set, subscribe, batch, setMany, setAsync, cancel, destroy).

Requires @everystate/core as a peer dependency.
It is opt-in and never runs automatically on install.
`.trim());
    process.exit(0);
  }

  try {
    await import('./self-test.js');
  } catch (err) {
    console.error('Self-test failed:', err.message);
    process.exit(1);
  }
})();
