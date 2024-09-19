// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import RequestManager from '@ember-data/request';
import Fetch from '@ember-data/request/fetch';
import Store, { CacheHandler } from '@ember-data/store';
import { CachePolicy } from '@ember-data/request-utils';
import type { CacheCapabilitiesManager } from '@ember-data/store/-types/q/cache-capabilities-manager';
import type { Cache } from '@warp-drive/core-types/cache';
import JSONAPICache from '@ember-data/json-api';
import {
  registerDerivations,
  SchemaService,
  withDefaults,
} from '@warp-drive/schema-record/schema';
import {
  instantiateRecord,
  teardownRecord,
} from '@warp-drive/schema-record/hooks';
import { SchemaRecord } from '@warp-drive/schema-record/record';
import type { StableRecordIdentifier } from '@warp-drive/core-types';
import StationHandler from 'winds-mobi-client-web/handlers/station';
import HistoryHandler from 'winds-mobi-client-web/handlers/history';
import { Type } from '@warp-drive/core-types/symbols';

const LocationSchema = withDefaults({
  type: 'location',
  fields: [{ name: 'coordinates', kind: 'array' }],
});

const PressureSchema = withDefaults({
  type: 'pressure',
  fields: [
    { name: 'qfe', kind: 'field' },
    { name: 'qnh', kind: 'field' },
    { name: 'qff', kind: 'field' },
  ],
});

const ReadingSchema = withDefaults({
  type: 'reading',
  fields: [
    { name: '_id', kind: 'field' },
    { name: 'w-dir', kind: 'field' },
    { name: 'w-avg', kind: 'field' },
    { name: 'w-max', kind: 'field' },
    { name: 'temp', kind: 'field' },
    { name: 'hum', kind: 'field' },
    { name: 'pres', kind: 'schema-object', type: 'pressure' },
    { name: 'rain', kind: 'field' },

    {
      name: 'direction',
      kind: 'derived',
      type: 'unwrap',
      options: {
        path: 'w-dir',
      },
    },

    {
      name: 'speed',
      kind: 'derived',
      type: 'unwrap',
      options: {
        path: 'w-avg',
      },
    },

    {
      name: 'gusts',
      kind: 'derived',
      type: 'unwrap',
      options: {
        path: 'w-max',
      },
    },

    {
      name: 'temperature',
      kind: 'derived',
      type: 'unwrap',
      options: {
        path: 'temp',
      },
    },

    {
      name: 'humidity',
      kind: 'derived',
      type: 'unwrap',
      options: {
        path: 'hum',
      },
    },

    {
      name: 'pressure',
      kind: 'derived',
      type: 'unwrap',
      options: {
        path: 'pres.qfe',
      },
    },
  ],
});

const StationSchema = withDefaults({
  type: 'station',
  fields: [
    // Fields from the API
    { name: '_id', kind: 'field' },
    { name: 'alt', kind: 'field' },
    { name: 'loc', kind: 'schema-object', type: 'location' },
    { name: 'peak', kind: 'field' },
    { name: 'pv-name', kind: 'field' },
    { name: 'short', kind: 'field' },
    { name: 'status', kind: 'field' },
    { name: 'url', kind: 'field' }, // TODO: this does not have to be string
    { name: 'last', kind: 'schema-object', type: 'reading' },

    // Aliases so that it's not a pain to work with
    {
      name: 'altitude',
      kind: 'derived',
      type: 'unwrap',
      options: {
        path: 'alt',
      },
    },

    {
      name: 'location',
      kind: 'derived',
      type: 'unwrap',
      options: {
        path: 'loc',
        type: 'location',
      },
    },

    {
      name: 'isPeak',
      kind: 'derived',
      type: 'unwrap',
      options: {
        path: 'peak',
      },
    },

    {
      name: 'providerName',
      kind: 'derived',
      type: 'unwrap',
      options: {
        path: 'pv-name',
      },
    },

    // TODO: I think this can be sometimes more complicated object
    {
      name: 'providerUrl',
      kind: 'derived',
      type: 'unwrap',
      options: {
        path: 'url',
      },
    },

    {
      name: 'name',
      kind: 'derived',
      type: 'unwrap',
      options: {
        path: 'short',
      },
    },

    {
      name: 'latitude',
      type: 'unwrap',
      options: {
        path: 'location.coordinates.1',
      },
      kind: 'derived',
    },

    {
      name: 'longitude',
      type: 'unwrap',
      options: {
        path: 'location.coordinates.0',
      },
      kind: 'derived',
    },
  ],
});

const HistorySchema = withDefaults({
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
  },
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

export default class StoreService extends Store {
  constructor(args: unknown) {
    super(args);
    this.requestManager = new RequestManager();
    this.requestManager.use([HistoryHandler, StationHandler, Fetch]);
    this.requestManager.useCache(CacheHandler);

    this.lifetimes = new CachePolicy({
      apiCacheHardExpires: 60 * 60 * 1000,
      apiCacheSoftExpires: 60 * 1000,
    });
  }

  createCache(capabilities: CacheCapabilitiesManager): Cache {
    return new JSONAPICache(capabilities);
  }

  createSchemaService() {
    const schema = new SchemaService();
    schema.registerResource(PressureSchema);
    schema.registerResource(ReadingSchema);
    schema.registerResource(LocationSchema);
    schema.registerResource(StationSchema);
    schema.registerResource(HistorySchema);

    schema.registerDerivation(unwrapDerivation);

    registerDerivations(schema);
    return schema;
  }

  instantiateRecord(
    identifier: StableRecordIdentifier,
    createRecordArgs: { [key: string]: unknown },
  ) {
    return instantiateRecord(this, identifier, createRecordArgs);
  }

  teardownRecord(record: SchemaRecord): void {
    teardownRecord(record);
  }
}
