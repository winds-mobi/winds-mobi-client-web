import { useLegacyStore } from '@warp-drive/legacy';
import { DefaultCachePolicy } from '@warp-drive/core/store';
import { JSONAPICache } from '@warp-drive/json-api';
import StationHandler from 'winds-mobi-client-web/handlers/station';
import HistoryHandler from 'winds-mobi-client-web/handlers/history';
// TODO: Remove login — UserHandler backs the disabled sign-in feature (see
// app/services/session.ts). Restore this import alongside it.
// import UserHandler from 'winds-mobi-client-web/handlers/user';
import { withDefaults } from '@warp-drive/core/reactive';
import type { ObjectSchema } from '@warp-drive/core/types/schema/fields';
import type { ObjectValue } from '@warp-drive/core/types/json/raw';
import { Type } from '@warp-drive/core/types/symbols';

// Embedded object schema: location (no identity, just a shape)
export const LocationSchema: ObjectSchema = {
  type: 'location',
  identity: null,
  fields: [{ name: 'coordinates', kind: 'array' }],
};

export const StationSchema = withDefaults({
  type: 'station',
  fields: [
    { name: '_id', kind: 'field' },
    { name: 'altitude', kind: 'field' },

    // Use location as an embedded object
    {
      name: 'location',
      kind: 'schema-object',
      type: 'location',
    },

    // Derived latitude + longitude from location.coordinates
    {
      name: 'longitude',
      kind: 'derived',
      type: 'unwrap',
      options: {
        path: 'location.coordinates.0',
      },
    },
    {
      name: 'latitude',
      kind: 'derived',
      type: 'unwrap',
      options: {
        path: 'location.coordinates.1',
      },
    },

    { name: 'isPeak', kind: 'field' },
    { name: 'providerName', kind: 'field' },
    { name: 'name', kind: 'field' },
    { name: 'status', kind: 'field' },

    // providerUrl is normalized to a single URL string in the station handler.
    { name: 'providerUrl', kind: 'field' },

    // Flat `last*` fields rather than one nested `last` object. Per Warp
    // Drive's documented cache contract (https://warp-drive.io/llms-full.txt):
    // fields are cached by ResourceKey + FieldName with *replace* semantics --
    // "if a field's value is an object, that object should be the full state
    // of the field not a partial state of the field, we will not deep-merge
    // during upsert." A nested `last` object is one field, so any later
    // request for the same station with a smaller `last` (e.g. the map's
    // lean list query, which only needs `last.w-dir`/`w-avg`/`w-max`) would
    // replace it wholesale, wiping temperature/humidity/rain/pressure
    // moments after the station detail's `findRecord` had populated them.
    // Flat top-level fields are each their own independently-preserved field
    // instead. `last` below is a derived convenience getter so consumers
    // keep reading `station.last.X`.
    { name: 'lastTimestamp', kind: 'field' },
    { name: 'lastDirection', kind: 'field' },
    { name: 'lastSpeed', kind: 'field' },
    { name: 'lastGusts', kind: 'field' },
    { name: 'lastTemperature', kind: 'field' },
    { name: 'lastHumidity', kind: 'field' },
    { name: 'lastRain', kind: 'field' },
    { name: 'lastPressure', kind: 'field' },
    { name: 'last', kind: 'derived', type: 'composeReading' },
  ],
});

// History is a resource schema: its records are fetched and cached by id.
export const HistorySchema = withDefaults({
  type: 'history',
  fields: [
    { name: 'direction', kind: 'field' },
    { name: 'speed', kind: 'field' },
    { name: 'gusts', kind: 'field' },
    { name: 'temperature', kind: 'field' },
    { name: 'humidity', kind: 'field' },
    { name: 'rain', kind: 'field' },
    { name: 'timestamp', kind: 'field' },
  ],
});

// TODO: Remove login — the authenticated user's profile from the
// winds-mobi-admin user API. Favourites no longer read from this; see
// app/services/favorites.ts. Restore alongside app/services/session.ts.
// export const ProfileSchema = withDefaults({
//   type: 'profile',
//   fields: [
//     { name: 'displayName', kind: 'field' },
//     { name: 'picture', kind: 'field' },
//     { name: 'favorites', kind: 'array' },
//   ],
// });

export type Station = {
  id: string;
  altitude: number;
  latitude: number;
  longitude: number;
  isPeak: boolean;
  providerName?: string;
  providerUrl?: string;
  name: string;
  last: {
    timestamp: number;
    direction: number;
    speed: number;
    gusts: number;
    temperature: number;
    humidity: number;
    pressure: number;
    rain: number;
  };

  [Type]: 'station';
};

// TODO: Remove login — Profile type paired with the commented-out
// ProfileSchema above. Kept live (types are inert at runtime) so
// app/builders/profile.ts keeps compiling.
export type Profile = {
  id: string;
  displayName?: string;
  picture?: string;
  favorites: string[];

  [Type]: 'profile';
};

export type History = {
  id: string;
  direction: number;
  speed: number;
  gusts: number;
  temperature: number;
  humidity: number;
  rain: number;
  timestamp: number;

  [Type]: 'history';
};

function isRecordType(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrapDerivation(
  record: unknown,
  options: ObjectValue | null
): unknown {
  const path = options?.['path'];

  if (typeof path !== 'string') {
    return undefined;
  }

  return path.split('.').reduce<unknown>((acc, key) => {
    if (Array.isArray(acc)) {
      const index = Number.parseInt(key, 10);

      return Number.isNaN(index) ? undefined : acc[index];
    }
    if (isRecordType(acc)) {
      return acc[key];
    }
    return undefined;
  }, record);
}
unwrapDerivation[Type] = 'unwrap';

// Reassembles the flat `last*` fields (see the comment on StationSchema)
// back into the nested shape consumers read as `station.last`.
function composeReadingDerivation(record: unknown): unknown {
  if (!isRecordType(record)) {
    return undefined;
  }

  return {
    timestamp: record['lastTimestamp'],
    direction: record['lastDirection'],
    speed: record['lastSpeed'],
    gusts: record['lastGusts'],
    temperature: record['lastTemperature'],
    humidity: record['lastHumidity'],
    rain: record['lastRain'],
    pressure: record['lastPressure'],
  };
}
composeReadingDerivation[Type] = 'composeReading';

const AppStore = useLegacyStore({
  linksMode: false,
  legacyRequests: true,
  modelFragments: true,
  cache: JSONAPICache,
  // TODO: Remove login — ProfileSchema was listed here; restore alongside it.
  schemas: [LocationSchema, StationSchema, HistorySchema],
  // TODO: Remove login — UserHandler ran first here: it owns the user-API
  // requests (auth header + profile reshaping) and must run before the
  // station/history reshapers see them. Restore alongside it.
  handlers: [StationHandler, HistoryHandler],
  derivations: [unwrapDerivation, composeReadingDerivation],
  // Warp Drive's own default (30s soft / 15min hard) means a manual refresh
  // pressed within 30s of the last fetch does nothing at all -- no request,
  // foreground or background (see issue #118). Shortening apiCacheSoftExpires
  // to 15s doesn't remove that dead window, but it does halve it, so a manual
  // refresh reflects new data sooner without forcing every refresh to bypass
  // the cache outright (which would defeat its point of avoiding redundant
  // requests). apiCacheHardExpires is left at Warp Drive's own default.
  policy: new DefaultCachePolicy({
    apiCacheSoftExpires: 15 * 1000,
    apiCacheHardExpires: 15 * 60 * 1000,
  }),
});

// The store *instance* type — exposes the generic `request<RT>(builder): Future<RT>`,
// unlike `typeof AppStore` (the class), so injecting `store: StoreService` lets call
// sites call `this.store.request(...)` without casting through `unknown`.
export type StoreService = InstanceType<typeof AppStore>;

export default AppStore;

declare module '@ember/service' {
  interface Registry {
    store: StoreService;
  }
}
