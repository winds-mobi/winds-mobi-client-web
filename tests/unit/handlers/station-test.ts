import { module, test } from 'qunit';
import type { NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';
import StationHandler from 'winds-mobi-client-web/handlers/station';
import { responseData } from 'winds-mobi-client-web/utils/request-response';

// `StationHandler.request` is called directly here (no store), so the
// `context`/`next` args are faked rather than pulled from a real request
// pipeline — `next` only needs to resolve with the raw upstream payload,
// never anything from `Future`'s abort/stream API.
function fakeContext(url: string): RequestContext {
  return { request: { url } } as unknown as RequestContext;
}

function fakeNext<T>(payload: unknown): NextFn<T> {
  return (() => Promise.resolve(payload)) as unknown as NextFn<T>;
}

module('Unit | Handler | station', function () {
  test('it only serializes station attributes present in the payload', async function (assert) {
    const response = responseData(
      await StationHandler.request<{
        data: {
          id: string;
          attributes: Record<string, unknown>;
        };
      }>(
        fakeContext(
          'https://winds.mobi/api/2.3/stations/holfuy-1850?keys=short&keys=alt&keys=last._id&keys=last.w-avg'
        ),
        fakeNext({
          content: {
            _id: 'holfuy-1850',
            short: 'Holfuy 1850',
            alt: 1850,
            last: {
              _id: 1_774_341_507,
              'w-avg': 12,
            },
          },
        })
      )
    );

    assert.deepEqual(response.attributes, {
      _id: 'holfuy-1850',
      altitude: 1850,
      name: 'Holfuy 1850',
      lastTimestamp: 1_774_341_507_000,
      lastSpeed: 12,
    });
    assert.false('providerName' in response.attributes);
    assert.false('providerUrl' in response.attributes);
    assert.false('status' in response.attributes);
  });

  test('it passes user-API requests through untouched', async function (assert) {
    const upstream = { content: { _id: 'user-1', favorites: [] } };

    const response = await StationHandler.request(
      fakeContext('https://winds.mobi/user/profile/'),
      fakeNext(upstream)
    );

    assert.strictEqual(response, upstream);
  });

  test('it keeps explicit provider fields from a detail payload', async function (assert) {
    const response = responseData(
      await StationHandler.request<{
        data: {
          id: string;
          attributes: Record<string, unknown>;
        };
      }>(
        fakeContext(
          'https://winds.mobi/api/2.3/stations/holfuy-1850?keys=pv-name&keys=url'
        ),
        fakeNext({
          content: {
            _id: 'holfuy-1850',
            'pv-name': 'holfuy.com',
            url: {
              en: 'https://holfuy.com/en/weather/1850',
            },
          },
        })
      )
    );

    assert.deepEqual(response.attributes, {
      _id: 'holfuy-1850',
      providerName: 'holfuy.com',
      providerUrl: 'https://holfuy.com/en/weather/1850',
    });
  });
});
