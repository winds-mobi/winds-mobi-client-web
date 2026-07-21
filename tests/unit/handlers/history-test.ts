import { module, test } from 'qunit';
import type { NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';
import HistoryHandler from 'winds-mobi-client-web/handlers/history';
import { responseData } from 'winds-mobi-client-web/utils/request-response';

// `HistoryHandler.request` is called directly here (no store), so the
// `context`/`next` args are faked rather than pulled from a real request
// pipeline — `next` only needs to resolve with the raw upstream payload,
// never anything from `Future`'s abort/stream API.
function fakeContext(url: string): RequestContext {
  return { request: { url } } as unknown as RequestContext;
}

function fakeNext<T>(payload: unknown): NextFn<T> {
  return (() => Promise.resolve(payload)) as unknown as NextFn<T>;
}

module('Unit | Handler | history', function () {
  test('it scopes historic record ids to the station id', async function (assert) {
    const payload = {
      content: [
        {
          _id: 1_774_341_507,
          'w-dir': 112,
          'w-avg': 3,
          'w-max': 7,
          temp: 7.5,
          hum: 70,
        },
      ],
    };

    const holfuyResponse = responseData(
      await HistoryHandler.request<{
        data: { id: string }[];
      }>(
        fakeContext(
          'https://winds.mobi/api/2.3/stations/holfuy-1804/historic/?duration=435600'
        ),
        fakeNext(payload)
      )
    );

    const otherStationResponse = responseData(
      await HistoryHandler.request<{
        data: { id: string }[];
      }>(
        fakeContext(
          'https://winds.mobi/api/2.3/stations/holfuy-2222/historic/?duration=435600'
        ),
        fakeNext(payload)
      )
    );

    assert.strictEqual(holfuyResponse[0]?.id, 'holfuy-1804:1774341507');
    assert.strictEqual(otherStationResponse[0]?.id, 'holfuy-2222:1774341507');
    assert.notStrictEqual(holfuyResponse[0]?.id, otherStationResponse[0]?.id);
  });

  test('it sorts newest-first historic API rows into chronological order', async function (assert) {
    const response = responseData(
      await HistoryHandler.request<{
        data: { id: string; attributes: { timestamp: number } }[];
      }>(
        fakeContext(
          'https://winds.mobi/api/2.3/stations/holfuy-1804/historic/?duration=435600'
        ),
        fakeNext({
          content: [
            {
              _id: 1_774_342_468,
              'w-dir': 167,
              'w-avg': 0,
              'w-max': 0,
              temp: 8.7,
              hum: 65,
            },
            {
              _id: 1_774_341_507,
              'w-dir': 112,
              'w-avg': 3,
              'w-max': 7,
              temp: 7.5,
              hum: 70,
            },
          ],
        })
      )
    );

    assert.deepEqual(
      response.map((record) => record.id),
      ['holfuy-1804:1774341507', 'holfuy-1804:1774342468']
    );
    assert.deepEqual(
      response.map((record) => record.attributes.timestamp),
      [1_774_341_507_000, 1_774_342_468_000]
    );
  });

  // The API is documented to return newest-first rows, but a plain reversal
  // only produces chronological order if that's actually true for every row.
  // A delayed/backfilled reading landing out of sequence (e.g. a station
  // catching up after being briefly offline) would slip through a `.reverse()`
  // unfixed and show up as a real glitch downstream: the polar wind-direction
  // chart's connecting line visibly jumping backwards in time (issue #111).
  // Sorting explicitly by timestamp is robust to that regardless of the
  // order the API actually returned the rows in.
  test('it sorts chronologically even when a row is out of sequence, not just reversed', async function (assert) {
    const response = responseData(
      await HistoryHandler.request<{
        data: { id: string; attributes: { timestamp: number } }[];
      }>(
        fakeContext(
          'https://winds.mobi/api/2.3/stations/holfuy-1804/historic/?duration=435600'
        ),
        fakeNext({
          content: [
            // Mostly newest-first as documented, but the middle row arrived
            // late (e.g. a backfilled reading) and landed out of sequence.
            // A plain `.reverse()` of this array yields
            // [341000, 342000, 340000] -- still not chronological -- whereas
            // an explicit sort fixes it regardless.
            { _id: 1_774_342_000, 'w-dir': 180, 'w-avg': 4, 'w-max': 8 },
            { _id: 1_774_340_000, 'w-dir': 160, 'w-avg': 2, 'w-max': 6 },
            { _id: 1_774_341_000, 'w-dir': 170, 'w-avg': 3, 'w-max': 7 },
          ],
        })
      )
    );

    assert.deepEqual(
      response.map((record) => record.attributes.timestamp),
      [1_774_340_000_000, 1_774_341_000_000, 1_774_342_000_000],
      'rows come out strictly chronological regardless of the order the API returned them in'
    );
  });

  test('it only serializes history attributes present in the payload', async function (assert) {
    const response = responseData(
      await HistoryHandler.request<{
        data: {
          id: string;
          attributes: Record<string, number>;
        }[];
      }>(
        fakeContext(
          'https://winds.mobi/api/2.3/stations/holfuy-1804/historic/?duration=435600&keys=temp&keys=hum&keys=rain'
        ),
        fakeNext({
          content: [
            {
              _id: 1_774_341_507,
              temp: 7.5,
              hum: 70,
              rain: 1.2,
            },
          ],
        })
      )
    );

    assert.deepEqual(response[0]?.attributes, {
      humidity: 70,
      rain: 1.2,
      temperature: 7.5,
      timestamp: 1_774_341_507_000,
    });
    assert.false('direction' in (response[0]?.attributes ?? {}));
    assert.false('speed' in (response[0]?.attributes ?? {}));
    assert.false('gusts' in (response[0]?.attributes ?? {}));
  });
});
