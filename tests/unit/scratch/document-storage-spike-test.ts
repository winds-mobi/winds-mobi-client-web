import { module, test } from 'qunit';

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
