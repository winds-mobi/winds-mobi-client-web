import { getOwner } from '@ember/owner';
import type { Future, Handler, NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';
import type RefreshService from 'winds-mobi-client-web/services/refresh';

async function trackFetch(refresh: RefreshService, future: Future<unknown>) {
  // A request can be issued mid-render (from a `@cached` request getter), so
  // step off the current render before writing the service's tracked state.
  await Promise.resolve();

  const done = refresh.fetchStarted();

  try {
    await future;
  } catch {
    // The request's own consumer handles its failure; this only tracks it.
  } finally {
    done();
  }
}

// Reports every refreshable request (see app/builders/refreshable.ts) that
// reaches the network to the shared refresh service, which is what ties any
// data fetch -- a pan, a station switch, an edited id list -- to the one
// refresh countdown/button. Only requests the cache can't answer get this far
// down the chain, so a cache hit never counts as a refresh. Passes the
// request through untouched.
const RefreshTrackingHandler: Handler = {
  request<T>(context: RequestContext, next: NextFn<T>) {
    const future = next(context.request);
    const { store, cacheOptions } = context.request;
    const refresh = store && getOwner(store)?.lookup('service:refresh');

    if (refresh && cacheOptions?.types?.length) {
      void trackFetch(refresh, future);
    }

    return future;
  },
};

export default RefreshTrackingHandler;
