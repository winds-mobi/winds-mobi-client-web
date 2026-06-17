import { tracked } from '@glimmer/tracking';

// One reactive cell per storage key. Reading `cell.value` in a template
// subscribes it; writing re-renders. The cell is created (and seeded) the first
// time a key is accessed — we set `value` *before* reading it, so there's no
// "mutated after consumed" autotrack violation. The (singleton) settings
// service shares one cell per key.
class Cell<T> {
  @tracked value!: T;
}

const cells = new Map<string, Cell<unknown>>();

function cellFor<T>(key: string, seed: () => T): Cell<T> {
  let cell = cells.get(key) as Cell<T> | undefined;

  if (!cell) {
    cell = new Cell<T>();
    cell.value = seed();
    cells.set(key, cell as Cell<unknown>);
  }

  return cell;
}

function safeGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    // Private-mode / disabled storage: fall back to the in-memory cell only.
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Ignore write failures; the tracked cell still reflects the value.
  }
}

function safeRemove(key: string): void {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // Ignore.
  }
}

function readStored<T>(key: string, fallback: T): T {
  const raw = safeGet(key);

  if (raw === null) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export interface TrackedLocalStorageOptions {
  // Storage key; defaults to the decorated property name.
  keyName?: string;
}

interface FieldDescriptor {
  initializer?: () => unknown;
}

/**
 * Decorator that mirrors a tracked property to `localStorage` (reads re-render,
 * writes persist). The property's own initializer is the default: while the
 * current value equals it the key is removed from storage, so the default can
 * evolve later. Written in the legacy decorator shape that `decorator-transforms`
 * supports, matching how `@tracked` is used in this app:
 *
 * ```ts
 * @trackedInLocalStorage({ keyName: 'settings.showThing' })
 * showThing = true;
 * ```
 *
 * Returns `any` so it type-checks as a property decorator under the app's
 * standard-decorator tsconfig; the property's type still comes from its
 * initializer.
 */
export function trackedInLocalStorage(
  options: TrackedLocalStorageOptions = {}
): any {
  return function (
    _target: object,
    propertyKey: string,
    descriptor?: FieldDescriptor
  ) {
    const key = options.keyName ?? propertyKey;
    const seed = () => readStored(key, descriptor?.initializer?.());

    return {
      get(): unknown {
        return cellFor(key, seed).value;
      },

      set(value: unknown) {
        const cell = cellFor(key, seed);
        const defaultValue = descriptor?.initializer?.();

        if (value === defaultValue) {
          safeRemove(key);
        } else {
          safeSet(key, JSON.stringify(value));
        }

        cell.value = value;
      },

      configurable: true,
      enumerable: true,
    };
  };
}
