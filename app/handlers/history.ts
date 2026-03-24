import type { NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';
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

function extractHistoricStationId(url: string | undefined) {
  if (!url) {
    return undefined;
  }

  const match = url.match(/\/stations\/([^/]+)\/historic\//);

  return match?.[1];
}

function renameFields(elm: HistoryApiPayload, stationId?: string) {
  // TODO: We should add `timestamp` field
  // It is timestamp = id, but to not shoot
  // ourselves in the foot in the end
  return {
    type: 'history',
    id: stationId ? `${stationId}:${elm._id}` : elm._id.toString(),
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
      const stationId = extractHistoricStationId(context.request.url);

      // JSON-API requires us to have IDs
      // Historic timestamps are only unique within a station,
      // so cache identity must include the station id.

      const contedWithIds = Array.isArray(content)
        ? content
            .map((elm) => renameFields(elm, stationId))
            .sort((a, b) => a.attributes.timestamp - b.attributes.timestamp)
        : renameFields(content, stationId);

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
