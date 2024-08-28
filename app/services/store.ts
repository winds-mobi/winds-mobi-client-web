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
import type { Type } from '@warp-drive/core-types/symbols';
import StationHandler from 'winds-mobi-client-web/handlers/station';

const StationSchema = withDefaults({
  type: 'station',
  fields: [
    { name: 'altitude', kind: 'field' },
    { name: 'latitude', kind: 'field' },
    { name: 'longitude', kind: 'field' },
    { name: 'isPeak', kind: 'field' },
    { name: 'providerName', kind: 'field' },
    { name: 'name', kind: 'field' },
    { name: 'last', kind: 'object' },
  ],
});

export type Station = {
  id: string;
  altitude: number;
  latitude: number;
  longitude: number;
  isPeak: boolean;
  providerName: string;
  name: string;
  last: {
    direction: number;
    speed: number;
    gusts: number;
  };

  [Type]: 'station';
};

export default class StoreService extends Store {
  constructor(args: unknown) {
    super(args);
    this.requestManager = new RequestManager();
    this.requestManager.use([StationHandler, Fetch]);
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
    schema.registerResource(StationSchema);
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
