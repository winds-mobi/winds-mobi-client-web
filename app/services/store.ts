import { useLegacyStore } from '@warp-drive/legacy';
import { JSONAPICache } from '@warp-drive/json-api';
import StationHandler from 'winds-mobi-client-web/handlers/station';
import HistoryHandler from 'winds-mobi-client-web/handlers/history';
import { withDefaults } from '@warp-drive/core/reactive';
import { Type } from '@warp-drive/core/types/symbols';

// Embedded object schema: location (no identity, just a shape)
export const LocationSchema = {
  type: 'location',
  identity: null,
  fields: [{ name: 'coordinates', kind: 'array' }],
} as const;

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

type RecordType = Record<string, unknown> | unknown[];

function isRecordType(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrapDerivation(
  record: RecordType,
  options: {
    path: string;
  }
): unknown {
  return options.path.split('.').reduce<unknown>((acc, key) => {
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
function composeReadingDerivation(record: RecordType): unknown {
  if (!isRecordType(record)) {
    return undefined;
  }

  return {
    timestamp: record.lastTimestamp,
    direction: record.lastDirection,
    speed: record.lastSpeed,
    gusts: record.lastGusts,
    temperature: record.lastTemperature,
    humidity: record.lastHumidity,
    rain: record.lastRain,
    pressure: record.lastPressure,
  };
}
composeReadingDerivation[Type] = 'composeReading';

const AppStore = useLegacyStore({
  linksMode: false,
  legacyRequests: true,
  modelFragments: true,
  cache: JSONAPICache,
  schemas: [LocationSchema, StationSchema, HistorySchema],
  handlers: [StationHandler, HistoryHandler],
  derivations: [unwrapDerivation, composeReadingDerivation],
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
