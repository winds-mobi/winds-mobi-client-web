import {
  type Handler,
  type NextFn,
  type RequestContext,
  // @ts-expect-error no TS yet
} from '@ember-data/request';
// import type { Pin } from 'the-mountains-are-calling/services/settings';

export interface Response {
  content: HistoryApiPayload[];
}

interface HistoryApiPayload {
  _id: number;
  'w-dir': number;
  'w-avg': number;
  'w-max': number;
  temp: number;
  hum: number;
}

function renameFields(elm: HistoryApiPayload) {
  // TODO: We should add `timestamp` field
  // It is timestamp = id, but to not shoot
  // ourselves in the foot in the end
  return {
    type: 'history',
    id: elm._id.toString(),
    attributes: {
      direction: elm['w-dir'],
      speed: elm['w-avg'],
      gusts: elm['w-max'],
      temperature: elm['temp'],
      humidity: elm['hum'],
      timestamp: elm._id * 1000,
    },
  };
}

const HistoryHandler: Handler = {
  async request<T>(context: RequestContext, next: NextFn<T>) {
    const regex = /.*\/historic\//;

    if (!regex.test(context.request.url || '')) {
      return next(context.request);
    }

    try {
      const { content } = (await next(context.request)) as Response;

      // JSON-API requires us to have IDs
      // Timestamps should be unique-enough

      const contedWithIds = Array.isArray(content)
        ? content
            .map((elm) => renameFields(elm))
            .sort((a, b) => a.attributes.timestamp - b.attributes.timestamp)
        : renameFields(content);

      const jsonApiLikeData = {
        links: {
          self: context.request.url,
        },
        data: contedWithIds,
      };

      return jsonApiLikeData as T;
    } catch (e) {
      console.log('HistoryHandler.request().catch()', { e });
      throw e;
    }
  },
};

export default HistoryHandler;
