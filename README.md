# @everystate/types v1.0.4

**Typed dot-path autocomplete for EveryState stores via recursive TypeScript template-literal types.**

Wraps `@everystate/core` with compile-time type safety. Every `get()`, `set()`, and `subscribe()` call gets full path autocomplete and value type resolution - zero runtime overhead.

## Installation

```bash
npm install @everystate/types @everystate/core
```

## Quick Start (TypeScript)

```ts
import { createTypedStore } from '@everystate/types';

const store = createTypedStore({
  ui: { theme: 'dark', lang: 'en' },
  count: 0,
  items: ['a', 'b', 'c']
});

store.get('ui.theme');       // autocomplete: 'ui' | 'ui.theme' | 'ui.lang' | 'count' | 'items'
                             // return type: string

store.set('count', 42);      // value must be number
store.set('count', 'oops');  // TS error: string is not assignable to number

store.subscribe('ui.*', (meta) => {
  console.log(meta.path, meta.value);
});
```

## Quick Start (JavaScript + JSDoc)

```js
import { typed } from '@everystate/types';
import { createEveryState } from '@everystate/core';

const store = typed(createEveryState({
  ui: { theme: 'dark' },
  count: 0
}));

// VSCode IntelliSense now shows all valid paths
store.get('ui.theme');  // autocomplete works in .js files too
```

## API

### `createTypedStore(initialState)`

Creates a new EveryState store with full type inference. Identical to `createEveryState()` at runtime - the types are compile-time only.

```ts
const store = createTypedStore({ ui: { theme: 'dark' } });
```

### `typed(existingStore)`

Wraps an existing store with type information. Zero runtime cost - returns the exact same object reference. Useful when you already have a store from `createEveryState()`.

```ts
const raw = createEveryState(initialState);
const store = typed(raw);  // same object, but typed
```

### Type Utilities

These are exported as TypeScript types for advanced use:

- **`DotPaths<T>`** - Union of every valid dot-path (namespace + leaf) in state shape T
- **`LeafPaths<T>`** - Leaf-only paths (excludes namespace objects)
- **`PathValue<T, P>`** - Resolves the value type at dot-path P in state shape T
- **`WildcardPaths<T>`** - Valid wildcard subscription patterns (`'namespace.*'`)
- **`TypedStore<T>`** - The full typed store interface

#### Example: custom typed helper

```ts
import type { DotPaths, PathValue } from '@everystate/types';

type MyState = { ui: { theme: string; toast: { visible: boolean } } };

// All valid paths:
type Paths = DotPaths<MyState>;
// = 'ui' | 'ui.theme' | 'ui.toast' | 'ui.toast.visible'

// Value at a specific path:
type Theme = PathValue<MyState, 'ui.theme'>;
// = string

type Visible = PathValue<MyState, 'ui.toast.visible'>;
// = boolean
```

## How It Works

The package uses TypeScript's recursive template-literal types to walk your initial state object at compile time and generate a union of every valid dot-path string. When you call `store.get('ui.theme')`, TypeScript:

1. Checks that `'ui.theme'` is a member of `DotPaths<YourState>`
2. Resolves the return type via `PathValue<YourState, 'ui.theme'>` to `string`
3. Shows you autocomplete for all valid paths as you type

At runtime, `createTypedStore` just calls `createEveryState`. The types vanish after compilation - zero bundle size overhead.

## Documentation

Full documentation available at [everystate.dev](https://everystate.dev).

## Ecosystem

| Package | Description | License |
|---|---|---|
| [@everystate/aliases](https://www.npmjs.com/package/@everystate/aliases) | Ergonomic single-character and short-name DOM aliases for vanilla JS | MIT |
| [@everystate/angular](https://www.npmjs.com/package/@everystate/angular) | Angular adapter: `usePath`, `useIntent`, `useWildcard`, `useAsync` — bridges store to Angular signals | MIT |
| [@everystate/core](https://www.npmjs.com/package/@everystate/core) | Path-based state management with wildcard subscriptions and async support | MIT |
| [@everystate/css](https://www.npmjs.com/package/@everystate/css) | Reactive CSSOM engine: design tokens, typed validation, WCAG enforcement, all via path-based state | MIT |
| [@everystate/examples](https://www.npmjs.com/package/@everystate/examples) | Example applications and patterns | MIT |
| [@everystate/perf](https://www.npmjs.com/package/@everystate/perf) | Performance monitoring overlay | MIT |
| [@everystate/react](https://www.npmjs.com/package/@everystate/react) | React hooks adapter: `usePath`, `useIntent`, `useAsync` hooks and `EventStateProvider` | MIT |
| [@everystate/renderer](https://www.npmjs.com/package/@everystate/renderer) | Direct-binding reactive renderer: `bind-*`, `set`, `each` attributes. Zero build step | MIT |
| [@everystate/router](https://www.npmjs.com/package/@everystate/router) | SPA routing as state | MIT |
| [@everystate/solid](https://www.npmjs.com/package/@everystate/solid) | Solid adapter: `usePath`, `useIntent`, `useWildcard`, `useAsync` — bridges store to Solid signals | MIT |
| [@everystate/test](https://www.npmjs.com/package/@everystate/test) | Event-sequence testing for EveryState stores. Zero dependency. | MIT |
| [@everystate/types](https://www.npmjs.com/package/@everystate/types) | Typed dot-path autocomplete for EveryState stores | MIT |
| [@everystate/view](https://www.npmjs.com/package/@everystate/view) | State-driven view: DOMless resolve + surgical DOM projector. View tree as first-class state | MIT |
| [@everystate/vue](https://www.npmjs.com/package/@everystate/vue) | Vue 3 composables adapter: `provideStore`, `usePath`, `useIntent`, `useWildcard`, `useAsync` | MIT |

## Self-test (CLI, opt-in)

The self-test verifies that `createTypedStore` and `typed` produce working
stores with the full API surface (get, set, subscribe, batch, setMany,
setAsync, cancel, destroy).

Requires `@everystate/core` as a peer dependency.
It is **opt-in** and never runs automatically on install:

```bash
# via npx (no install needed)
npx everystate-types-self-test

# if installed locally
everystate-types-self-test

# or directly
node node_modules/@everystate/types/self-test.js
```

You can also run the npm script from the package folder:

```bash
npm --prefix node_modules/@everystate/types run self-test
```

### Integration tests (@everystate/test)

The `tests/` folder contains a separate integration suite that uses
`@everystate/test` and `@everystate/core` (declared as `devDependencies` / `peerDependencies`).
The **self-test** requires only the peer dependency, while integration tests
remain available for deeper store-level validation.

**For end users** (after installing the package):

```bash
# Install test dependency
npm install @everystate/test

# Run from package folder
cd node_modules/@everystate/types
npm run test:integration
# or short alias
npm run test:i
```

Or, from your project root:

```bash
npm --prefix node_modules/@everystate/types run test:integration
```

**For package developers** (working in the source repo):

```bash
npm install
npm run test:integration
```

## License

MIT (c) Ajdin Imsirovic
