/**
 * @everystate/types - Typed dot-path autocomplete for EveryState stores
 *
 * Leverages TypeScript recursive template-literal types to generate
 * a union of every valid dot-path from an initial state object.
 *
 * Insight: dot-path "tips" (leaves) are always typed primitives
 * (string, number, boolean, null, array). Objects are just namespaces -
 * path prefixes, not values. This guarantees finite-depth recursion and
 * means every path resolves to a concrete type.
 *
 * Usage (TypeScript):
 *   import { createTypedStore } from '@everystate/types';
 *   const store = createTypedStore(INITIAL_STATE);
 *   store.get('state.users.filter');   // ← autocomplete + type: string
 *
 * Usage (JavaScript + JSDoc):
 *   import { typed } from '@everystate/types';
 *   const store = typed(createEveryState(INITIAL_STATE));
 *   // VSCode IntelliSense now shows all valid paths
 */

// ─── Core path utilities ────────────────────────────────────────

/**
 * Union of every valid dot-path (both namespace and leaf) in T.
 * Arrays are treated as leaf values - recursion stops there.
 *
 * Example:
 *   type S = { ui: { theme: string; toast: { visible: boolean } } }
 *   DotPaths<S> = 'ui' | 'ui.theme' | 'ui.toast' | 'ui.toast.visible'
 */
export type DotPaths<T, Prefix extends string = ''> =
  T extends readonly any[] ? never :
  T extends Record<string, any>
    ? { [K in keyof T & string]:
        | `${Prefix}${K}`
        | (T[K] extends readonly any[] ? never :
           T[K] extends Record<string, any> ? DotPaths<T[K], `${Prefix}${K}.`> : never)
      }[keyof T & string]
    : never;

/**
 * Leaf-only dot-paths: paths whose value is NOT a plain object (namespace).
 * These are the paths you'd typically subscribe to.
 *
 * Example:
 *   LeafPaths<S> = 'ui.theme' | 'ui.toast.visible'
 *   (excludes 'ui' and 'ui.toast' because those are namespaces)
 */
export type LeafPaths<T, Prefix extends string = ''> =
  T extends readonly any[] ? never :
  T extends Record<string, any>
    ? { [K in keyof T & string]:
        T[K] extends readonly any[]
          ? `${Prefix}${K}`
          : T[K] extends Record<string, any>
            ? LeafPaths<T[K], `${Prefix}${K}.`>
            : `${Prefix}${K}`
      }[keyof T & string]
    : never;

/**
 * Resolve the value type at a given dot-path.
 *
 * Example:
 *   PathValue<S, 'ui.toast.visible'> = boolean
 *   PathValue<S, 'ui.toast'>         = { visible: boolean }
 */
export type PathValue<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T ? PathValue<T[K], Rest> : never
    : P extends keyof T ? T[P] : never;

/**
 * Wildcard paths: valid patterns for wildcard subscriptions.
 * Generates 'namespace.*' for every namespace that has children.
 *
 * Example:
 *   WildcardPaths<S> = 'ui.*' | 'ui.toast.*'
 */
export type WildcardPaths<T, Prefix extends string = ''> =
  T extends readonly any[] ? never :
  T extends Record<string, any>
    ? { [K in keyof T & string]:
        | (T[K] extends readonly any[] ? never :
           T[K] extends Record<string, any>
             ? `${Prefix}${K}.*` | WildcardPaths<T[K], `${Prefix}${K}.`>
             : never)
      }[keyof T & string]
    : never;

// ─── Typed store interface ──────────────────────────────────────

/**
 * A fully typed EveryState store.
 *
 * Every path argument is constrained to valid dot-paths derived from
 * the initial state type T. Values are resolved per-path.
 */
export interface TypedStore<T extends Record<string, any>> {
  /** Get value at a typed dot-path. */
  get<P extends DotPaths<T>>(path: P): PathValue<T, P>;
  /** Get entire state tree. */
  get(path?: undefined): T;

  /** Set value at a typed dot-path. */
  set<P extends DotPaths<T>>(path: P, value: PathValue<T, P>): PathValue<T, P>;
  /** Set with dynamic path (for computed paths like `query.${name}.status`). */
  set(path: string, value: any): any;

  /** Set multiple paths atomically. */
  setMany(entries: { [P in DotPaths<T>]?: PathValue<T, P> }): void;
  /** Set multiple paths with dynamic keys. */
  setMany(entries: Record<string, any>): void;

  /** Async set with automatic loading lifecycle (query.path.status/data/error). */
  setAsync(path: string, fetcher: (signal: AbortSignal) => Promise<any>): Promise<any>;

  /** Cancel an in-flight setAsync operation. */
  cancel(path: string): void;

  /** Subscribe to a typed path. Callback receives the resolved value. */
  subscribe<P extends DotPaths<T>>(
    path: P,
    handler: (value: PathValue<T, P>, meta?: { path: string; value: any; oldValue: any }) => void
  ): () => void;
  /** Subscribe to a wildcard or global pattern. */
  subscribe(
    path: WildcardPaths<T> | '*' | (string & {}),
    handler: (meta: { path: string; value: any; oldValue: any }) => void
  ): () => void;

  /** Batch multiple set() calls - subscribers fire once after batch completes. */
  batch(fn: () => void): void;

  /** Destroy store and clear all subscriptions. */
  destroy(): void;
}

// ─── Factory functions ──────────────────────────────────────────

/**
 * Create a new typed EveryState store.
 * Wraps createEveryState with full path autocomplete.
 *
 * ```ts
 * import { createTypedStore } from '@everystate/types';
 * const store = createTypedStore({ ui: { theme: 'dark' } });
 * store.get('ui.theme'); // string, with autocomplete
 * ```
 */
export function createTypedStore<T extends Record<string, any>>(initial: T): TypedStore<T>;

/**
 * Type-assert an existing store. Zero runtime cost - identity function.
 * Useful in JS files with JSDoc:
 *
 * ```js
 * import { typed } from '@everystate/types';
 * import { createEveryState } from '@everystate/core';
 * /** @type {import('./store.js').INITIAL_STATE} *\/
 * const store = typed(createEveryState(INITIAL_STATE));
 * ```
 */
export function typed<T extends Record<string, any>>(store: any): TypedStore<T>;
