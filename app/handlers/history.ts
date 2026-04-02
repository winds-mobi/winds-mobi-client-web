import type { NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';
// import type { Pin } from 'the-mountains-are-calling/services/settings';

export interface Response {
  content: HistoryApiPayload[];
}

interface HistoryApiPayload {
  _id: number;
  'w-dir'?: number;
  'w-avg'?: number;
  'w-max'?: number;
  temp?: number;
  hum?: number;
  rain?: number;
}

function extractHistoricStationId(url: string | undefined) {
  if (!url) {
    return undefined;
  }

  const match = url.match(/\/stations\/([^/]+)\/historic\//);

  return match?.[1];
}

function renameFields(elm: HistoryApiPayload, stationId?: string) {
  const attributes: Record<string, number> = {
    timestamp: elm._id * 1000,
  };

  if ('w-dir' in elm) {
    attributes['direction'] = elm['w-dir']!;
  }

  if ('w-avg' in elm) {
    attributes['speed'] = elm['w-avg']!;
  }

  if ('w-max' in elm) {
    attributes['gusts'] = elm['w-max']!;
  }

  if ('temp' in elm) {
    attributes['temperature'] = elm['temp']!;
  }

  if ('hum' in elm) {
    attributes['humidity'] = elm['hum']!;
  }

  if ('rain' in elm) {
    attributes['rain'] = elm['rain']!;
  }

  return {
    type: 'history',
    id: stationId ? `${stationId}:${elm._id}` : elm._id.toString(),
    attributes,
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
      // The historic API returns newest-first rows, but the app consumes
      // history in chronological order for charting and the last-hour graph.

      const contedWithIds = Array.isArray(content)
        ? content.map((elm) => renameFields(elm, stationId)).reverse()
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
