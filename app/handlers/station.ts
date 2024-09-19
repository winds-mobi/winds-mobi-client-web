import {
  type Handler,
  type NextFn,
  type RequestContext,
} from '@ember-data/request';

export interface Response {
  content: StationApiPayload[];
}

interface StationApiPayload {
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
  url: string;
  last: {
    _id: number;
    'w-dir': number;
    'w-avg': number;
    'w-max': number;
    temp: number;
    hum: number;
    pres?: {
      qfe: number;
      qnh: number;
      qff: number;
    };
    rain: number;
  };
}

function renameFields(elm: StationApiPayload) {
  console.log('TODO: this should not peek into all the stations:', elm.short);
  return {
    type: 'station',
    id: elm._id,
    attributes: {
      altitude: elm.alt,
      latitude: elm.loc.coordinates[1],
      longitude: elm.loc.coordinates[0],
      isPeak: elm.peak,
      providerName: elm['pv-name'],
      providerUrl: elm['url'],
      name: elm['short'],
      last: {
        direction: elm.last['w-dir'],
        speed: elm.last['w-avg'],
        gusts: elm.last['w-max'],
        temperature: elm.last['temp'],
        humidity: elm.last['hum'],
        pressure: elm.last?.pres?.qfe,
        rain: elm.last.rain,
      },
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
