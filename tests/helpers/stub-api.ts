import type { TestContext } from '@ember/test-helpers';
import RefreshService from 'winds-mobi-client-web/services/refresh';

const API_URL = 'https://winds.mobi/api/';

// `settled()` waits for an open refresh cycle to close (see
// app/services/refresh.ts), so every fetch through the stubbed API would hold
// a test for the full grace window; a short one keeps that wait short.
export class ShortGraceRefreshService extends RefreshService {
  cycleGraceMs = 20;
}

// What the stubbed API answers a request with: the raw (terse, pre-handler)
// payload, or a promise of one to hold the request in flight.
type Responder = (url: URL) => unknown;

export interface StubbedApi {
  // Every API URL requested so far, in order.
  calls: string[];
  respond: Responder;
}

// Minimal raw payloads per endpoint, so a test only overrides what it asserts on.
function defaultResponse(url: URL): unknown {
  if (url.pathname.includes('/historic/')) {
    return [];
  }

  const id = /\/stations\/([^/]+)\/$/.exec(url.pathname)?.[1];

  return id ? { _id: id, name: id } : [];
}

// Stubs the network under the *real* store -- for tests that need its cache
// policy and invalidation (refreshing), which a fake `service:store` can't
// provide. `window.fetch` answers winds.mobi API requests from `respond`,
// records them in `calls`, and passes everything else (MapLibre's style and
// tiles) through untouched.
export function setupStubbedApi(hooks: NestedHooks): StubbedApi {
  const api: StubbedApi = { calls: [], respond: defaultResponse };
  let originalFetch: typeof window.fetch;

  hooks.beforeEach(function (this: TestContext) {
    this.owner.register('service:refresh', ShortGraceRefreshService);
    api.calls = [];
    api.respond = defaultResponse;
    originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);

      if (!url.startsWith(API_URL)) {
        return originalFetch(input, init);
      }

      api.calls.push(url);

      const body = await api.respond(new URL(url));

      return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          date: new Date().toUTCString(),
        },
      });
    };
  });

  hooks.afterEach(function () {
    window.fetch = originalFetch;
  });

  return api;
}
