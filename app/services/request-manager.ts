import Service from '@ember/service';
import { LegacyNetworkHandler } from '@ember-data/legacy-compat';
import type { Handler, NextFn, RequestContext } from '@ember-data/request';
import RequestManager from '@ember-data/request';
import Fetch from '@ember-data/request/fetch';

/* eslint-disable no-console */
const TestHandler: Handler = {
  async request<T>(context: RequestContext, next: NextFn<T>) {
    console.log('TestHandler.request', context.request);
    const result = await next(Object.assign({}, context.request));
    console.log('TestHandler.response after fetch', result.response);
    return result;
  },
};

export default class RequestManagerService extends RequestManager {
  constructor(args?: Record<string | symbol, unknown>) {
    super(args);
    this.use([LegacyNetworkHandler, TestHandler, Fetch]);
  }
}

// Don't remove this declaration: this is what enables TypeScript to resolve
// this service using `Owner.lookup('service:request')`, as well
// as to check when you pass the service name as an argument to the decorator,
// like `@service('request') declare altName: RequestService;`.
declare module '@ember/service' {
  interface Registry {
    request: RequestManagerService;
  }
}
