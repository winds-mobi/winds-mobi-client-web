import { module, test } from 'qunit';
import StationHandler from 'winds-mobi-client-web/handlers/station';

module('Unit | Handler | station', function () {
  test('it only serializes station attributes present in the payload', async function (assert) {
    const response = await StationHandler.request<{
      data: {
        id: string;
        attributes: Record<string, unknown>;
      };
    }>(
      {
        request: {
          url: 'https://winds.mobi/api/2.3/stations/holfuy-1850?keys=short&keys=alt&keys=last._id&keys=last.w-avg',
        },
      } as never,
      async () =>
        ({
          content: {
            _id: 'holfuy-1850',
            short: 'Holfuy 1850',
            alt: 1850,
            last: {
              _id: 1_774_341_507,
              'w-avg': 12,
            },
          },
        }) as never
    );

    assert.deepEqual(response.data.attributes, {
      _id: 'holfuy-1850',
      altitude: 1850,
      name: 'Holfuy 1850',
      last: {
        timestamp: 1_774_341_507_000,
        speed: 12,
      },
    });
    assert.false('providerName' in response.data.attributes);
    assert.false('providerUrl' in response.data.attributes);
    assert.false('status' in response.data.attributes);
  });

  test('it keeps explicit provider fields from a detail payload', async function (assert) {
    const response = await StationHandler.request<{
      data: {
        id: string;
        attributes: Record<string, unknown>;
      };
    }>(
      {
        request: {
          url: 'https://winds.mobi/api/2.3/stations/holfuy-1850?keys=pv-name&keys=url',
        },
      } as never,
      async () =>
        ({
          content: {
            _id: 'holfuy-1850',
            'pv-name': 'holfuy.com',
            url: {
              en: 'https://holfuy.com/en/weather/1850',
            },
          },
        }) as never
    );

    assert.deepEqual(response.data.attributes, {
      _id: 'holfuy-1850',
      providerName: 'holfuy.com',
      providerUrl: 'https://holfuy.com/en/weather/1850',
    });
  });
});
