import { module, test } from 'qunit';
import { setupTest } from 'winds-mobi-client-web/tests/helpers';
import { recordIdentifierFor } from '@warp-drive/core';
import type { RequestKey } from '@warp-drive/core/types/identifier';
import type { StoreService } from 'winds-mobi-client-web/services/store';

// SPIKE (issue #143 item 5) -- throwaway, not meant to be committed. Exercises
// @warp-drive/experiments/document-storage's real API directly (not through a
// WarpDrive request handler -- that integration is a separate, much bigger
// piece; see TODO.md item 5 for what it would actually take) to check the
// underlying primitive (OPFS + BroadcastChannel) works at all in this app's
// real target browsers.
module('Spike | document-storage', function () {
  test('OPFS is available in this environment', function (assert) {
    assert.ok(
      typeof navigator.storage?.getDirectory === 'function',
      'navigator.storage.getDirectory exists'
    );
  });

  test('putDocument/getDocument round-trips a minimal document', async function (assert) {
    const { DocumentStorage } = await import(
      '@warp-drive/experiments/document-storage'
    );

    const storage = new DocumentStorage({
      scope: `spike-${Date.now()}`,
      isolated: true,
    });

    const resourceKey = { lid: 'spike-resource-1' };
    const resource = {
      id: '1',
      type: 'spike',
      lid: 'spike-resource-1',
      attributes: { name: 'test' },
    };

    await storage.putDocument(
      {
        content: {
          lid: 'spike-doc-1',
          data: resourceKey,
        },
      } as never,
      () => resource
    );

    const doc = await storage.getDocument({ lid: 'spike-doc-1' });
    const data = (doc?.content as { data?: { id?: string } } | undefined)?.data;

    assert.strictEqual(
      data?.id,
      '1',
      'the round-tripped document contains the resource we put in'
    );

    await storage.clear();
  });

  // Phase 1 of reviving issue #143 item 5 (see TODO.md): confirm a *collection*
  // document -- the shape a real map station-list query actually produces --
  // round-trips, not just the single-resource case above.
  test('putDocument/getDocument round-trips a collection of station-like resources', async function (assert) {
    const { DocumentStorage } = await import(
      '@warp-drive/experiments/document-storage'
    );

    const storage = new DocumentStorage({
      scope: `spike-collection-${Date.now()}`,
      isolated: true,
    });

    const resourceKeys = [
      { lid: 'station:holfuy-1829', type: 'station', id: 'holfuy-1829' },
      { lid: 'station:holfuy-1808', type: 'station', id: 'holfuy-1808' },
    ];
    const resourcesByLid: Record<string, unknown> = {
      'station:holfuy-1829': {
        id: 'holfuy-1829',
        type: 'station',
        lid: 'station:holfuy-1829',
        attributes: { name: 'Zermatt', lastDirection: 180, lastSpeed: 12 },
      },
      'station:holfuy-1808': {
        id: 'holfuy-1808',
        type: 'station',
        lid: 'station:holfuy-1808',
        attributes: { name: 'Verbier', lastDirection: 90, lastSpeed: 8 },
      },
    };

    await storage.putDocument(
      {
        content: {
          lid: 'spike-collection-doc-1',
          data: resourceKeys,
        },
      } as never,
      (resourceIdentifier: { lid: string }) =>
        resourcesByLid[resourceIdentifier.lid] as never
    );

    const doc = await storage.getDocument({ lid: 'spike-collection-doc-1' });
    const data = (
      doc?.content as { data?: { id?: string }[] } | undefined
    )?.data;

    assert.strictEqual(data?.length, 2, 'both stations round-tripped');
    assert.strictEqual(data?.[0]?.id, 'holfuy-1829', 'first station id matches');
    assert.strictEqual(data?.[1]?.id, 'holfuy-1808', 'second station id matches');

    await storage.clear();
  });
});

// Phase 1, part 2: confirm the REAL integration point -- can a request's
// StructuredDocument, as cached by our actual store/schema, be read back via
// the public Cache.peekRequest/peek API in a shape DocumentStorage can
// persist and restore? This is the piece the original spike explicitly left
// unverified ("no public usage guide beyond the type signatures"). Persisting
// happens *after* a request resolves (in app code, not a request Handler --
// WarpDrive's CacheHandler runs outside the `handlers` array we control, so a
// handler positioned there never sees `lid`-bearing PersistedResourceKeys;
// only the store's own cache, post-resolution, has them).
module('Spike | document-storage real store integration', function (hooks) {
  setupTest(hooks);

  const requestLid = 'spike-real-station-query';

  function seedCache(store: StoreService) {
    store.cache.put({
      request: {
        url: 'https://example.com/spike-stations',
        method: 'GET',
        cacheOptions: { key: requestLid },
      },
      response: null,
      content: {
        lid: requestLid,
        data: [
          {
            type: 'station',
            id: 'holfuy-1829',
            attributes: {
              _id: 'holfuy-1829',
              name: 'Zermatt',
              lastDirection: 180,
              lastSpeed: 12,
            },
          },
          {
            type: 'station',
            id: 'holfuy-1808',
            attributes: {
              _id: 'holfuy-1808',
              name: 'Verbier',
              lastDirection: 90,
              lastSpeed: 8,
            },
          },
        ],
      },
    } as never);
  }

  test('step 1: cache.put + peekRequest gives back real PersistedResourceKeys', function (assert) {
    const store = this.owner.lookup('service:store') as StoreService;

    seedCache(store);

    const requestKey: RequestKey = { lid: requestLid, type: '@document' };
    const cachedDoc = store.cache.peekRequest(requestKey);

    assert.ok(cachedDoc, 'peekRequest finds the document we just put');

    const cachedData = (
      cachedDoc?.content as { data?: unknown[] } | undefined
    )?.data;

    assert.strictEqual(
      cachedData?.length,
      2,
      'the cached document has both stations'
    );

    const firstIdentifier = cachedData?.[0] as
      | { lid?: string; id?: string; type?: string }
      | undefined;

    assert.ok(
      typeof firstIdentifier?.lid === 'string',
      'the cached document identifies resources by a real lid, not just id/type'
    );

    const [firstRecord] = store.peekAll('station') as unknown as {
      id: string;
    }[];

    assert.ok(firstRecord, 'peekAll finds a hydrated record');

    if (firstRecord) {
      const identifier = recordIdentifierFor(firstRecord);
      assert.strictEqual(
        typeof identifier.lid,
        'string',
        'recordIdentifierFor gives a real lid for a hydrated record too'
      );
    }
  });

  test('step 2: store.cache.peek resolves a single resource by its PersistedResourceKey', function (assert) {
    const store = this.owner.lookup('service:store') as StoreService;

    seedCache(store);

    const requestKey: RequestKey = { lid: requestLid, type: '@document' };
    const cachedDoc = store.cache.peekRequest(requestKey);
    const cachedData = (
      cachedDoc?.content as { data?: { lid: string }[] } | undefined
    )?.data;
    const firstKey = cachedData?.[0];

    assert.ok(firstKey, 'have a resource key to peek');

    if (firstKey) {
      const resource = store.cache.peek(firstKey as never);

      assert.ok(resource, 'store.cache.peek resolves the resource');
      console.log('peek result:', JSON.stringify(resource));
    }
  });

  test('step 3: DocumentStorage.putDocument with a resourceCollector backed by store.cache.peek', async function (assert) {
    assert.timeout(8000);

    const store = this.owner.lookup('service:store') as StoreService;

    seedCache(store);

    const requestKey: RequestKey = { lid: requestLid, type: '@document' };
    const cachedDoc = store.cache.peekRequest(requestKey);

    assert.ok(cachedDoc, 'have a cached doc to persist');
    console.log('cachedDoc:', JSON.stringify(cachedDoc));

    const { DocumentStorage } = await import(
      '@warp-drive/experiments/document-storage'
    );
    const storage = new DocumentStorage({
      scope: `spike-real-${Date.now()}`,
      isolated: true,
    });

    console.log('calling putDocument...');
    await storage.putDocument(cachedDoc as never, (resourceIdentifier) => {
      console.log('resourceCollector called with:', resourceIdentifier);
      const resource = store.cache.peek(resourceIdentifier as never);
      console.log('resourceCollector resolved:', JSON.stringify(resource));
      return resource as never;
    });
    console.log('putDocument resolved');

    assert.ok(true, 'putDocument resolved without hanging');

    await storage.clear();
  });
});
