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

// Embedded object schema: pressure (also just a shape)
// You can later use it from another schema as
// { name: 'pressure', kind: 'schema-object', type: 'pressure' }
export const PressureSchema = {
  type: 'pressure',
  identity: null,
  fields: [
    { name: 'qfe', kind: 'field' },
    { name: 'qnh', kind: 'field' },
    { name: 'qff', kind: 'field' },
  ],
} as const;

// Embedded object schema: reading
// NOTE: no `withDefaults` and `identity: null` so it can safely be used
// as `kind: 'schema-object'` from StationSchema.
export const ReadingSchema = {
  type: 'reading',
  identity: null,
  fields: [
    // `_id` is *not* unique here, we’re just reusing it as a timestamp field
    { name: 'timestamp', kind: 'field' },
    { name: 'direction', kind: 'field' },
    { name: 'speed', kind: 'field' },
    { name: 'gusts', kind: 'field' },
    { name: 'temperature', kind: 'field' },
    { name: 'humidity', kind: 'field' },
    { name: 'rain', kind: 'field' },
    { name: 'pressure', kind: 'schema-object', type: 'pressure' },
  ],
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

    // last = embedded reading object
    { name: 'last', kind: 'schema-object', type: 'reading' },
  ],
});

// This one can stay as a resource schema (if you’re fetching histories as records)
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
  providerName: string;
  providerUrl: string;
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

export default useLegacyStore({
  linksMode: false,
  legacyRequests: true,
  modelFragments: true,
  cache: JSONAPICache,
  schemas: [
    PressureSchema,
    ReadingSchema,
    LocationSchema,
    StationSchema,
    HistorySchema,
  ],
  handlers: [StationHandler, HistoryHandler],
  derivations: [unwrapDerivation],
});

declare module '@ember/service' {
  interface Registry {
    store: typeof import('winds-mobi-client-web/services/store').default;
  }
}
