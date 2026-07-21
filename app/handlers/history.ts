import type { Handler, NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';
import { toJsonApiEnvelope } from './json-api';

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

    const { content } = (await next(context.request)) as Response;
    const stationId = extractHistoricStationId(context.request.url);

    // JSON-API requires us to have IDs
    // Historic timestamps are only unique within a station,
    // so cache identity must include the station id.
    // The historic API is documented to return newest-first rows, but the
    // app's charts (the polar wind-direction graph in particular -- see
    // issue #111) assume chronological order and don't sort or validate
    // it themselves; Highcharts renders whichever order it's given rather
    // than correcting it (see tests/integration/components/chart/point-order-test.ts).
    // A plain `.reverse()` only produces chronological order if the API's
    // rows were already perfectly newest-first, which isn't guaranteed --
    // e.g. a backfilled/delayed reading arriving out of sequence would
    // silently carry through as a visible glitch (a line jumping backwards
    // in time). Sorting explicitly by `_id` (the historic timestamp, in
    // seconds) is robust to that regardless of the order the API returned.

    const contentWithIds = Array.isArray(content)
      ? content
          .toSorted((a, b) => a._id - b._id)
          .map((elm) => renameFields(elm, stationId))
      : renameFields(content, stationId);

    return toJsonApiEnvelope<T>(context.request.url, contentWithIds);
  },
};

export default HistoryHandler;
