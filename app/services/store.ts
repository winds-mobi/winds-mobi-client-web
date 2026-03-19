import { useLegacyStore } from '@warp-drive/legacy';
import { JSONAPICache } from '@warp-drive/json-api';
import StationHandler from 'winds-mobi-client-web/handlers/station';
import HistoryHandler from 'winds-mobi-client-web/handlers/history';
import { withDefaults } from '@warp-drive/schema-record';
import { Type } from '@warp-drive/core-types/symbols';

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
    { name: 'timestamp', sourceKey: '_id', kind: 'field' },
    { name: 'direction', sourceKey: 'w-dir', kind: 'field' },
    { name: 'speed', sourceKey: 'w-avg', kind: 'field' },
    { name: 'gusts', sourceKey: 'w-max', kind: 'field' },
    { name: 'temperature', sourceKey: 'temp', kind: 'field' },
    { name: 'humidity', sourceKey: 'hum', kind: 'field' },
    { name: 'rain', sourceKey: 'rain', kind: 'field' },
    { name: 'pressure', kind: 'schema-object', type: 'pressure' },
  ],
} as const;

export const StationSchema = withDefaults({
  type: 'station',
  fields: [
    { name: '_id', kind: 'field' },
    { name: 'altitude', kind: 'field', sourceKey: 'alt' },

    // Use location as an embedded object
    {
      name: 'location',
      kind: 'schema-object',
      type: 'location',
      sourceKey: 'loc',
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

    { name: 'isPeak', kind: 'field', sourceKey: 'peak' },
    { name: 'providerName', kind: 'field', sourceKey: 'pv-name' },
    { name: 'name', kind: 'field', sourceKey: 'short' },
    { name: 'status', kind: 'field' },

    // providerUrl stays as a raw field (since the value is an object of URLs)
    { name: 'providerUrl', kind: 'field', sourceKey: 'url' },

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
  timestamp: number;

  [Type]: 'history';
};

// TODO: TS shenanigans
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RecordType = { [key: string]: RecordType | any } | any[];

function unwrapDerivation(
  record: RecordType,
  options: {
    path: string;
  }
) {
  return options.path.split('.').reduce((acc, key) => {
    if (Array.isArray(acc)) {
      return acc[parseInt(key)];
    }
    if (typeof acc === 'object') {
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
    // -- your schemas here
  ],
  handlers: [StationHandler, HistoryHandler],
  derivations: [unwrapDerivation],
});

declare module '@ember/service' {
  interface Registry {
    store: typeof import('winds-mobi-client-web/services/store').default;
  }
}
