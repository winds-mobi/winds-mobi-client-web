import { Type } from '@warp-drive/core/types/symbols';
import type { Station } from 'winds-mobi-client-web/services/store';

type StationOverrides = Partial<Omit<Station, 'last' | typeof Type>> & {
  last?: Partial<Station['last']>;
};

// A station record for tests: Holfuy 1804's shape and a recent reading, with
// `providerUrl` derived from `id`. Pass only the fields a test asserts on, so
// what each test depends on stays visible at the call site.
export function stationFixture(overrides: StationOverrides = {}): Station {
  const { last, ...station } = overrides;
  const id = station.id ?? 'holfuy-1804';

  return {
    altitude: 1804,
    latitude: 46.67719,
    longitude: 7.86323,
    isPeak: false,
    providerName: 'Holfuy',
    providerUrl: `https://example.com/stations/${id}`,
    name: 'Holfuy 1804',
    ...station,
    id,
    last: {
      timestamp: 1_710_000_000_000,
      direction: 240,
      speed: 12,
      gusts: 18,
      temperature: 7,
      humidity: 65,
      pressure: 1012,
      rain: 0,
      ...last,
    },
    [Type]: 'station',
  };
}

// The pair from #167: a MeteoSwiss peak station and an SLF station just below
// it, close enough that their map markers overlap -- the case hiding exists for.
export const OVERLAPPING_STATIONS: Station[] = [
  stationFixture({
    id: 'meteoswiss-PMA',
    altitude: 2500,
    latitude: 46.577,
    longitude: 9.53,
    isPeak: true,
    providerName: 'MeteoSwiss',
    name: 'Piz Martegnas',
  }),
  stationFixture({
    id: 'slf-PMA2',
    altitude: 2450,
    latitude: 46.5768,
    longitude: 9.5292,
    providerName: 'SLF',
    name: 'Colms da Parsonz',
    last: {
      direction: 220,
      speed: 2,
      gusts: 4,
      temperature: 3,
      humidity: 58,
      pressure: 1008,
    },
  }),
];
