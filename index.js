/**
 * @everystate/types - Typed dot-path autocomplete for EveryState stores
 *
 * Runtime: thin wrappers around @everystate/core.
 * The real work is in index.d.ts - TypeScript recursive template-literal types.
 * This file just provides the runtime so imports resolve in the browser.
 */

import { createEveryState } from '@everystate/core';

/**
 * Create a typed EveryState store.
 * Identical to createEveryState at runtime - types are compile-time only.
 * @template T
 * @param {T} initial
 * @returns {import('./index.d.ts').TypedStore<T>}
 */
export function createTypedStore(initial) {
  return createEveryState(initial);
}

/**
 * Type-assert an existing store. Identity function - zero runtime cost.
 * @template T
 * @param {*} store
 * @returns {import('./index.d.ts').TypedStore<T>}
 */
export function typed(store) {
  return store;
}
