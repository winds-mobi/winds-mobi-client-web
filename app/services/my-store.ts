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
    {
      name: 'short',
      kind: 'field',
    },
    {
      name: 'loc',
      kind: 'object',
    },
    { name: 'last', kind: 'object' },
  ],
});

export type Station = {
  id: string;
  short: string;

  [Type]: 'user';
};

export default class MyStoreService extends Store {
  constructor(args: unknown) {
    super(args);
    // @service requestManager;
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

// // Don't remove this declaration: this is what enables TypeScript to resolve
// // this service using `Owner.lookup('service:my-store')`, as well
// // as to check when you pass the service name as an argument to the decorator,
// // like `@service('my-store') declare altName: MyStoreService;`.
// declare module '@ember/service' {
//   interface Registry {
//     'my-store': MyStoreService;
//   }
// }
