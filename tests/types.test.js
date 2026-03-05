/**
 * @everystate/types: integration tests via @everystate/test
 *
 * Tests the typed store wrappers through EveryState using createEventTest.
 * Verifies: createTypedStore produces a fully functional store,
 * typed() is a zero-cost identity wrapper, and all core store
 * operations (get, set, subscribe, batch, setMany) work through
 * the typed interface.
 */

import { createEventTest, runTests } from '@everystate/test';
import { createEveryState } from '@everystate/core';
import { createTypedStore, typed } from '@everystate/types';

const results = runTests({

  // == createTypedStore basics ==

  'createTypedStore returns a store with get/set': () => {
    const store = createTypedStore({ count: 0, label: 'hello' });
    if (store.get('count') !== 0) throw new Error('initial count should be 0');
    if (store.get('label') !== 'hello') throw new Error('initial label should be hello');
    store.set('count', 10);
    if (store.get('count') !== 10) throw new Error('count should be 10 after set');
    store.destroy();
  },

  'createTypedStore with nested state': () => {
    const store = createTypedStore({
      ui: { theme: 'dark', toast: { visible: false, message: '' } },
      data: { items: [1, 2, 3] }
    });
    if (store.get('ui.theme') !== 'dark') throw new Error('nested get ui.theme');
    if (store.get('ui.toast.visible') !== false) throw new Error('deep nested get');
    store.set('ui.toast.visible', true);
    if (store.get('ui.toast.visible') !== true) throw new Error('deep nested set');
    if (!Array.isArray(store.get('data.items'))) throw new Error('array not preserved');
    store.destroy();
  },

  // == typed() identity ==

  'typed returns exact same reference': () => {
    const raw = createEveryState({ x: 1 });
    const wrapped = typed(raw);
    if (wrapped !== raw) throw new Error('typed should return same reference');
    if (wrapped.get('x') !== 1) throw new Error('get should work through typed');
    wrapped.set('x', 2);
    if (raw.get('x') !== 2) throw new Error('mutation should be visible on original');
    raw.destroy();
  },

  // == subscribe ==

  'subscribe fires on path change': () => {
    const store = createTypedStore({ name: 'Alice' });
    let received = null;
    store.subscribe('name', (val) => { received = val; });
    store.set('name', 'Bob');
    if (received !== 'Bob') throw new Error('subscriber should receive Bob');
    store.destroy();
  },

  'subscribe returns working unsubscribe': () => {
    const store = createTypedStore({ v: 0 });
    let count = 0;
    const unsub = store.subscribe('v', () => { count++; });
    store.set('v', 1);
    if (count !== 1) throw new Error('should be notified once');
    unsub();
    store.set('v', 2);
    if (count !== 1) throw new Error('should not be notified after unsub');
    store.destroy();
  },

  // == wildcard subscribe ==

  'wildcard subscription on namespace': () => {
    const store = createTypedStore({ ui: { a: 1, b: 2 } });
    let fires = 0;
    store.subscribe('ui.*', () => { fires++; });
    store.set('ui.a', 10);
    store.set('ui.b', 20);
    if (fires !== 2) throw new Error('wildcard should fire twice, got ' + fires);
    store.destroy();
  },

  // == batch ==

  'batch coalesces multiple sets': () => {
    const store = createTypedStore({ x: 0 });
    let fires = 0;
    store.subscribe('x', () => { fires++; });
    store.batch(() => {
      store.set('x', 1);
      store.set('x', 2);
      store.set('x', 3);
    });
    if (fires !== 1) throw new Error('batch should fire once, got ' + fires);
    if (store.get('x') !== 3) throw new Error('final value should be 3');
    store.destroy();
  },

  // == setMany ==

  'setMany updates multiple paths atomically': () => {
    const store = createTypedStore({ a: 0, b: 0, c: 0 });
    store.setMany({ a: 1, b: 2, c: 3 });
    if (store.get('a') !== 1) throw new Error('a should be 1');
    if (store.get('b') !== 2) throw new Error('b should be 2');
    if (store.get('c') !== 3) throw new Error('c should be 3');
    store.destroy();
  },

  // == createEventTest integration ==

  'createEventTest works with createTypedStore state': () => {
    const t = createEventTest({ count: 0, label: 'test' });
    t.trigger('count', 5);
    t.assertPath('count', 5);
    t.assertType('count', 'number');
    t.assertType('label', 'string');
  },

  'createEventTest tracks events through typed store': () => {
    const t = createEventTest({ ui: { theme: 'dark' } });
    t.trigger('ui.theme', 'light');
    t.assertPath('ui.theme', 'light');
    t.assertEventFired('ui.theme', 1);
    t.trigger('ui.theme', 'auto');
    t.assertEventFired('ui.theme', 2);
  },

  // == destroy ==

  'destroy clears subscriptions': () => {
    const store = createTypedStore({ v: 0 });
    let fires = 0;
    store.subscribe('v', () => { fires++; });
    store.destroy();
    try { store.set('v', 99); } catch (e) { /* ok */ }
    if (fires !== 0) throw new Error('no fires after destroy');
  },

  // == full state get ==

  'get with no args returns full state tree': () => {
    const store = createTypedStore({ ui: { theme: 'dark' }, count: 5 });
    const state = store.get();
    if (typeof state !== 'object') throw new Error('should return object');
    if (store.get('count') !== 5) throw new Error('count should be 5');
    store.destroy();
  },

});
