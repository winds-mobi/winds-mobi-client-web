import type { NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';

export interface Response {
  content: StationApiPayload[];
}

interface StationApiPayload {
  _id: string;
  alt?: number;
  loc?: {
    coordinates?: [number, number];
  };
  peak?: boolean;
  'pv-name'?: string;
  short?: string;
  name?: string;
  status?: string;
  url?: Record<string, string>;
  last?: {
    _id?: number;
    'w-dir'?: number;
    'w-avg'?: number;
    'w-max'?: number;
    temp?: number;
    hum?: number;
    rain?: number;
    pres?: {
      qfe?: number | null;
      qnh?: number | null;
      qff?: number | null;
    };
  };
}

function normalizePressure(
  pressure:
    | number
    | {
        qfe?: number | null;
        qnh?: number | null;
        qff?: number | null;
      }
    | undefined
) {
  if (typeof pressure === 'number') {
    return pressure;
  }

  return pressure?.qfe ?? pressure?.qnh ?? pressure?.qff;
}

function jsonApifyFields(elm: StationApiPayload) {
  const last = elm.last
    ? {
        timestamp: elm.last._id,
        direction: elm.last['w-dir'],
        speed: elm.last['w-avg'],
        gusts: elm.last['w-max'],
        temperature: elm.last.temp,
        humidity: elm.last.hum,
        rain: elm.last.rain,
        pressure: normalizePressure(elm.last.pres),
      }
    : undefined;

  return {
    type: 'station',
    id: elm._id,
    attributes: {
      _id: elm._id,
      altitude: elm.alt,
      location: elm.loc
        ? {
            coordinates: elm.loc.coordinates,
          }
        : undefined,
      isPeak: elm.peak,
      providerName: elm['pv-name'],
      name: elm.short ?? elm.name,
      status: elm.status,
      providerUrl: elm.url,
      last,
    },
  };
}

const StationHandler: Handler = {
  async request<T>(context: RequestContext, next: NextFn<T>) {
    const isHistoric = /.*\/historic\//;
    const isStation = /.*\/station\//;
    const url = context.request.url || '';

    if (isHistoric.test(url) && !isStation.test(url)) {
      return next(context.request);
    }

    try {
      const { content } = (await next(context.request)) as Response;

      // JSON-API requires us to have IDs
      // Timestamps should be unique-enough
      const contedWithIds = Array.isArray(content)
        ? content.map((elm) => jsonApifyFields(elm))
        : jsonApifyFields(content);

      const jsonApiLikeData = {
        links: {
          self: context.request.url,
        },
        data: contedWithIds,
      };

      return jsonApiLikeData as T;
    } catch (e) {
      console.log('StationHandler.request().catch()', { e });
      throw e;
    }
  },
};

export default StationHandler;
