import type { TestContext } from '@ember/test-helpers';
import RefreshService from 'winds-mobi-client-web/services/refresh';
import type { History, Station } from 'winds-mobi-client-web/services/store';

const API_URL = 'https://winds.mobi/api/';

// `settled()` waits for an open refresh cycle to close (see
// app/services/refresh.ts), so every fetch through the stubbed API would hold
// a test for the full grace window; a short one keeps that wait short.
export class ShortGraceRefreshService extends RefreshService {
  cycleGraceMs = 20;
}

// An error status for the stubbed API to answer with instead of a payload.
class ApiError {
  constructor(readonly status: number) {}
}

export function apiError(status = 500): ApiError {
  return new ApiError(status);
}

// What the stubbed API answers a request with: the raw (terse, pre-handler)
// payload, `apiError(status)`, or a promise of either to hold the request in
// flight.
type Responder = (url: URL) => unknown;

export interface StubbedApi {
  // Every API URL requested so far, in order. Only requests that reach the
  // network land here: the real store answers cache hits itself.
  calls: string[];
  respond: Responder;
}

// The raw API payload the station handler turns back into `station`, so tests
// can keep building records with `stationFixture()`.
export function rawStation(station: Station) {
  const { last } = station;

  return {
    _id: station.id,
    alt: station.altitude,
    loc: { coordinates: [station.longitude, station.latitude] },
    peak: station.isPeak,
    name: station.name,
    ...(station.providerName !== undefined && {
      'pv-name': station.providerName,
    }),
    ...(station.providerUrl !== undefined && {
      url: { default: station.providerUrl },
    }),
    last: {
      _id: last.timestamp / 1000,
      'w-dir': last.direction,
      'w-avg': last.speed,
      'w-max': last.gusts,
      temp: last.temperature,
      hum: last.humidity,
      rain: last.rain,
      pres: { qfe: last.pressure },
    },
  };
}

// The raw API payload the history handler turns back into `history`: the API
// lists readings newest first, with timestamps in seconds.
export function rawHistory(history: History[]) {
  return [...history].reverse().map((reading) => ({
    _id: reading.timestamp / 1000,
    'w-dir': reading.direction,
    'w-avg': reading.speed,
    'w-max': reading.gusts,
    temp: reading.temperature,
    hum: reading.humidity,
    rain: reading.rain,
  }));
}

// A responder serving `stations` and `history` the way the real API would:
// a station by id, a list (narrowed to the request's `ids` and `search`),
// and every station's history. An unknown station id answers 404.
export function stationsApi({
  stations = [],
  history = [],
}: {
  stations?: Station[];
  history?: History[];
}): Responder {
  return (url) => {
    if (url.pathname.includes('/historic/')) {
      return rawHistory(history);
    }

    const id = /\/stations\/([^/]+)\/$/.exec(url.pathname)?.[1];

    if (id) {
      const station = stations.find((candidate) => candidate.id === id);

      return station ? rawStation(station) : apiError(404);
    }

    const ids = url.searchParams.getAll('ids');
    const search = url.searchParams.get('search')?.toLowerCase();
    const listed = stations.filter(
      (station) =>
        (!ids.length || ids.includes(station.id)) &&
        (!search || station.name.toLowerCase().includes(search))
    );

    return listed.map(rawStation);
  };
}

// Minimal raw payloads per endpoint, so a test only overrides what it asserts on.
function defaultResponse(url: URL): unknown {
  if (url.pathname.includes('/historic/')) {
    return [];
  }

  const id = /\/stations\/([^/]+)\/$/.exec(url.pathname)?.[1];

  return id ? { _id: id, name: id } : [];
}

// Stubs the network under the *real* store, so tests exercise its handlers,
// cache policy and invalidation. `window.fetch` answers winds.mobi API
// requests from `respond`, records them in `calls`, and passes everything else
// (MapLibre's style and tiles) through untouched.
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
      const headers = {
        'content-type': 'application/json',
        date: new Date().toUTCString(),
      };

      if (body instanceof ApiError) {
        return new Response(JSON.stringify({ detail: 'error' }), {
          status: body.status,
          headers,
        });
      }

      return new Response(JSON.stringify(body), { status: 200, headers });
    };
  });

  hooks.afterEach(function () {
    window.fetch = originalFetch;
  });

  return api;
}
