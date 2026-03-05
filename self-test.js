/**
 * @everystate/types - self-test (zero-dependency structural verification)
 *
 * Verifies:
 *   - Module loads and exports resolve
 *   - createTypedStore is a function that returns a working store
 *   - typed is an identity function (returns same reference)
 *   - Store API surface (get, set, subscribe, batch, setMany, setAsync, cancel, destroy)
 *
 * Requires @everystate/core as peerDependency (runtime passthrough).
 * Does NOT require TypeScript - all type checking is compile-time only.
 */

import { createTypedStore, typed } from '@everystate/types';

let passed = 0;
let failed = 0;

function assert(cond, label) {
  if (cond) {
    console.log(`  \u2713 ${label}`);
    passed++;
  } else {
    console.error(`  \u2717 ${label}`);
    failed++;
  }
}

function section(name) {
  console.log(`\n== ${name} ==`);
}

// == Exports ==

section('exports');

assert(typeof createTypedStore === 'function', 'createTypedStore is a function');
assert(typeof typed === 'function', 'typed is a function');
assert(createTypedStore.length === 1, 'createTypedStore arity is 1');
assert(typed.length === 1, 'typed arity is 1');

// == createTypedStore ==

section('createTypedStore');

const store = createTypedStore({
  ui: { theme: 'dark', lang: 'en' },
  count: 0,
  items: ['a', 'b']
});

assert(typeof store === 'object' && store !== null, 'returns an object');
assert(typeof store.get === 'function', 'store.get exists');
assert(typeof store.set === 'function', 'store.set exists');
assert(typeof store.subscribe === 'function', 'store.subscribe exists');
assert(typeof store.batch === 'function', 'store.batch exists');
assert(typeof store.setMany === 'function', 'store.setMany exists');
assert(typeof store.setAsync === 'function', 'store.setAsync exists');
assert(typeof store.cancel === 'function', 'store.cancel exists');
assert(typeof store.destroy === 'function', 'store.destroy exists');

// == get / set ==

section('get / set');

assert(store.get('ui.theme') === 'dark', 'get ui.theme returns dark');
assert(store.get('ui.lang') === 'en', 'get ui.lang returns en');
assert(store.get('count') === 0, 'get count returns 0');

store.set('count', 42);
assert(store.get('count') === 42, 'set count to 42, get returns 42');

store.set('ui.theme', 'light');
assert(store.get('ui.theme') === 'light', 'set ui.theme to light');

// == subscribe ==

section('subscribe');

let notified = false;
const unsub = store.subscribe('count', () => { notified = true; });
assert(typeof unsub === 'function', 'subscribe returns unsubscribe function');

store.set('count', 99);
assert(notified === true, 'subscriber was notified on set');

notified = false;
unsub();
store.set('count', 100);
assert(notified === false, 'unsubscribed - not notified');

// == batch ==

section('batch');

let batchNotifyCount = 0;
store.subscribe('count', () => { batchNotifyCount++; });

store.batch(() => {
  store.set('count', 200);
  store.set('count', 201);
  store.set('count', 202);
});
assert(batchNotifyCount === 1, 'batch fires subscriber once for 3 sets');

// == setMany ==

section('setMany');

store.setMany({ 'ui.theme': 'auto', 'ui.lang': 'de' });
assert(store.get('ui.theme') === 'auto', 'setMany updated ui.theme');
assert(store.get('ui.lang') === 'de', 'setMany updated ui.lang');

// == typed (identity) ==

section('typed');

const raw = store;
const wrapped = typed(raw);
assert(wrapped === raw, 'typed returns exact same reference');
assert(wrapped.get('count') === store.get('count'), 'typed store works identically');

// == destroy ==

section('destroy');

store.destroy();
assert(true, 'destroy did not throw');

// == Summary ==

console.log(`\n@everystate/types v1.0.1 self-test`);
if (failed > 0) {
  console.error(`\u2717 ${failed} assertion(s) failed, ${passed} passed`);
  process.exit(1);
} else {
  console.log(`\u2713 ${passed} assertions passed`);
}
