import {
  type Handler,
  type NextFn,
  type RequestContext,
  // @ts-expect-error no TS yet
} from '@ember-data/request';
// import type { Pin } from 'the-mountains-are-calling/services/settings';

export interface Response {
  content: Station[];
}

interface Station {
  _id: string;
  alt: number;
  loc: {
    type: 'Point';
    coordinates: [number, number];
  };
  peak: boolean;
  'pv-name': string;
  short: string;
  status: 'green';
  last: {
    _id: number;
    'w-dir': number;
    'w-avg': number;
    'w-max': number;
  };
}

function renameFields(elm) {
  return {
    type: 'station',
    id: elm._id,
    attributes: {
      altitude: elm.alt,
      latitude: elm.loc.coordinates[1],
      longitude: elm.loc.coordinates[0],
      isPeak: elm.peak,
      providerName: elm['pv-name'],
      name: elm['short'],
      last: {
        direction: elm.last['w-dir'],
        speed: elm.last['w-avg'],
        gusts: elm.last['w-max'],
      },
    },
  };
}

const StationHandler: Handler = {
  async request<T>(context: RequestContext, next: NextFn<T>) {
    const regex = /.*\/stations/;

    if (!regex.test(context.request.url || '')) return next(context.request);
    // if (context.request.op !== 'station') return next(context.request);

    try {
      const { content } = (await next(context.request)) as Response;

      // JSON-API requires us to have IDs
      // Timestamps should be unique-enough
      const contedWithIds = Array.isArray(content)
        ? content.map((elm) => renameFields(elm))
        : renameFields(content);

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
