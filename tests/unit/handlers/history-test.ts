import { module, test } from 'qunit';
import HistoryHandler from 'winds-mobi-client-web/handlers/history';

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

    const holfuyResponse = await HistoryHandler.request<{
      data: { id: string }[];
    }>(
      {
        request: {
          url: 'https://winds.mobi/api/2.3/stations/holfuy-1804/historic/?duration=435600',
        },
      } as never,
      async () => payload as never
    );

    const otherStationResponse = await HistoryHandler.request<{
      data: { id: string }[];
    }>(
      {
        request: {
          url: 'https://winds.mobi/api/2.3/stations/holfuy-2222/historic/?duration=435600',
        },
      } as never,
      async () => payload as never
    );

    assert.strictEqual(holfuyResponse.data[0]?.id, 'holfuy-1804:1774341507');
    assert.strictEqual(
      otherStationResponse.data[0]?.id,
      'holfuy-2222:1774341507'
    );
    assert.notStrictEqual(
      holfuyResponse.data[0]?.id,
      otherStationResponse.data[0]?.id
    );
  });

  test('it keeps historic records sorted by timestamp', async function (assert) {
    const response = await HistoryHandler.request<{
      data: { id: string; attributes: { timestamp: number } }[];
    }>(
      {
        request: {
          url: 'https://winds.mobi/api/2.3/stations/holfuy-1804/historic/?duration=435600',
        },
      } as never,
      async () =>
        ({
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
        }) as never
    );

    assert.deepEqual(
      response.data.map((record) => record.id),
      ['holfuy-1804:1774341507', 'holfuy-1804:1774342468']
    );
    assert.deepEqual(
      response.data.map((record) => record.attributes.timestamp),
      [1_774_341_507_000, 1_774_342_468_000]
    );
  });
});
