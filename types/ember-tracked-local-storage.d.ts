// ember-tracked-local-storage ships no TypeScript types (plain JS + JSDoc).
// This ambient declaration covers the surface this app actually uses: the
// `trackedInLocalStorage` decorator and the `tracked-local-storage` service
// it's backed by. The decorator return type is deliberately `any` — same
// workaround this app's own former hand-rolled decorator used — so it
// type-checks as a property decorator under the standard-decorator tsconfig;
// the property's own type annotation is what actually matters to consumers.
declare module 'ember-tracked-local-storage' {
  export function trackedInLocalStorage(options?: {
    keyName?: string;
    keyNameProperty?: string;
    defaultValue?: unknown;
    skipPrefixes?: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): any;
}

export interface TrackedLocalStorageService {
  getItem(keyName: string, skipPrefixes?: string[]): unknown;
  setItem(keyName: string, value: unknown, skipPrefixes?: string[]): void;
  removeItem(keyName: string, skipPrefixes?: string[]): void;
  clear(): void;
  readonly length: number;
  key(index: number): string | null;
  setGlobalPrefix(name: string, value: string): void;
}

declare module '@ember/service' {
  interface Registry {
    'tracked-local-storage': TrackedLocalStorageService;
  }
}
