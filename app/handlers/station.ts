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

function hasOwn<T extends object>(obj: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function normalizeProviderUrl(urls?: Record<string, string>) {
  if (!urls) {
    return undefined;
  }

  return urls.default ?? urls.en ?? Object.values(urls)[0];
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
  const attributes: Record<string, unknown> = {
    _id: elm._id,
  };

  if (hasOwn(elm, 'alt')) {
    attributes.altitude = elm.alt;
  }

  if (hasOwn(elm, 'loc')) {
    attributes.location = elm.loc
      ? {
          coordinates: elm.loc.coordinates,
        }
      : elm.loc;
  }

  if (hasOwn(elm, 'peak')) {
    attributes.isPeak = elm.peak;
  }

  if (hasOwn(elm, 'pv-name')) {
    attributes.providerName = elm['pv-name'];
  }

  if (hasOwn(elm, 'short') || hasOwn(elm, 'name')) {
    attributes.name = elm.short ?? elm.name;
  }

  if (hasOwn(elm, 'status')) {
    attributes.status = elm.status;
  }

  if (hasOwn(elm, 'url')) {
    attributes.providerUrl = normalizeProviderUrl(elm.url);
  }

  if (hasOwn(elm, 'last') && elm.last) {
    const last: Record<string, unknown> = {};

    if (hasOwn(elm.last, '_id') && elm.last._id !== undefined) {
      last.timestamp = elm.last._id * 1000;
    }

    if (hasOwn(elm.last, 'w-dir')) {
      last.direction = elm.last['w-dir'];
    }

    if (hasOwn(elm.last, 'w-avg')) {
      last.speed = elm.last['w-avg'];
    }

    if (hasOwn(elm.last, 'w-max')) {
      last.gusts = elm.last['w-max'];
    }

    if (hasOwn(elm.last, 'temp')) {
      last.temperature = elm.last.temp;
    }

    if (hasOwn(elm.last, 'hum')) {
      last.humidity = elm.last.hum;
    }

    if (hasOwn(elm.last, 'rain')) {
      last.rain = elm.last.rain;
    }

    if (hasOwn(elm.last, 'pres')) {
      const pressure = normalizePressure(elm.last.pres);

      if (pressure !== undefined) {
        last.pressure = pressure;
      }
    }

    if (Object.keys(last).length > 0) {
      attributes.last = last;
    }
  }

  return {
    type: 'station',
    id: elm._id,
    attributes,
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
