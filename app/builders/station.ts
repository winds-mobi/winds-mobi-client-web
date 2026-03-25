import { buildBaseURL, buildQueryParams } from '@warp-drive/utilities';
import { pluralize } from '@warp-drive/utilities/string';
import type {
  ConstrainedRequestOptions,
  FindRecordOptions,
  FindRecordRequestOptions,
  QueryRequestOptions,
} from '@warp-drive/core/types/request';
import type { QueryParamsSource } from '@warp-drive/core/types/params';
import { query as jsonApiQuery } from '@warp-drive/utilities/json-api';
import type { MapBounds } from 'winds-mobi-client-web/utils/map-view';

import { findRecord as jsonApiFindRecord } from '@warp-drive/utilities/json-api';

const defaultQuery: QueryParamsSource = {
  keys: [
    'pv-name',
    'short',
    'name',
    'alt',
    'peak',
    'status',
    'loc',
    'url',
    'last._id',
    'last.w-dir',
    'last.w-avg',
    'last.w-max',
    'last.temp',
    'last.hum',
    'last.rain',
    'last.pres',
    'last.hum',
  ],
};

const defaultOptions: ConstrainedRequestOptions = {
  urlParamsSettings: {
    arrayFormat: 'repeat' as const,
  },
};

const mapStationQueryKeys = [
  'short',
  'loc',
  'status',
  'pv-name',
  'alt',
  'peak',
  'last._id',
  'last.w-dir',
  'last.w-avg',
  'last.w-max',
] as const;

function findRecord<T>(
  type: string,
  id: string,
  query?: QueryParamsSource,
  options?: FindRecordOptions
): FindRecordRequestOptions<{ data: T }, T> {
  const mergedQuery: QueryParamsSource = {
    ...defaultQuery,
    ...query,
  };
  const mergedOptions: FindRecordOptions = {
    ...defaultOptions,
    ...options,
  };
  const baseURL = buildBaseURL({
    resourcePath: pluralize(type),
    op: 'findRecord',
    identifier: { type, id },
  });
  const qp = buildQueryParams(mergedQuery, {
    ...defaultOptions.urlParamsSettings,
    ...options?.urlParamsSettings,
  });
  const url = `${baseURL}?${qp}`;

  const jsonApiObject = jsonApiFindRecord<T>(type, id, mergedOptions);
  return {
    ...jsonApiObject,
    url,
  };
}

function query<T>(
  type: string,
  query?: QueryParamsSource,
  options?: ConstrainedRequestOptions
): QueryRequestOptions<{ data: T[] }> {
  const mergedQuery: QueryParamsSource = {
    ...defaultQuery,
    ...query,
  };
  const mergedOptions: ConstrainedRequestOptions = {
    ...defaultOptions,
    ...options,
  };

  return jsonApiQuery<T>(type, mergedQuery, mergedOptions);
}

function mapQuery<T>(
  type: string,
  bounds: MapBounds,
  options?: ConstrainedRequestOptions
): QueryRequestOptions<{ data: T[] }> {
  return query<T>(
    type,
    {
      'is-highest-duplicates-rating': true,
      keys: [...mapStationQueryKeys],
      limit: 470,
      'within-pt1-lat': bounds.northEast[1],
      'within-pt1-lon': bounds.northEast[0],
      'within-pt2-lat': bounds.southWest[1],
      'within-pt2-lon': bounds.southWest[0],
    },
    options
  );
}

function nearbyQuery<T>(
  type: string,
  latitude: number,
  longitude: number,
  limit = 10,
  options?: ConstrainedRequestOptions
): QueryRequestOptions<{ data: T[] }> {
  return query<T>(
    type,
    {
      'is-highest-duplicates-rating': true,
      limit,
      'near-lat': latitude,
      'near-lon': longitude,
    },
    options
  );
}

export { findRecord, mapQuery, nearbyQuery, query };
