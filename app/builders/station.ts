import { buildBaseURL, buildQueryParams } from '@warp-drive/utilities';
import { pluralize } from '@warp-drive/utilities/string';
import type {
  ConstrainedRequestOptions,
  FindRecordOptions,
  FindRecordRequestOptions,
  QueryRequestOptions,
} from '@warp-drive/core/types/request';
import type { QueryParamsSource } from '@warp-drive/core/types/params';
import type {
  TypedRecordInstance,
  TypeFromInstance,
} from '@warp-drive/core/types/record';
import { query as jsonApiQuery } from '@warp-drive/utilities/json-api';
import type { MapBounds } from 'winds-mobi-client-web/utils/map-view';
import type { Coordinates } from 'winds-mobi-client-web/utils/location';

import { findRecord as jsonApiFindRecord } from '@warp-drive/utilities/json-api';

const defaultStationQueryKeys = [
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
] as const;

const defaultQuery: QueryParamsSource = {
  keys: [...defaultStationQueryKeys],
};

const defaultOptions: ConstrainedRequestOptions = {
  urlParamsSettings: {
    arrayFormat: 'repeat' as const,
  },
};

const summaryStationQueryKeys = [
  'short',
  'loc',
  'status',
  'alt',
  'peak',
  'last._id',
  'last.w-dir',
  'last.w-avg',
  'last.w-max',
] as const;

function findRecord<T extends TypedRecordInstance>(
  type: TypeFromInstance<T>,
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
  const url = `${baseURL}/?${qp}`;

  const jsonApiObject = jsonApiFindRecord<T>(type, id, mergedOptions);
  return {
    ...jsonApiObject,
    url,
  };
}

function query<T extends TypedRecordInstance>(
  type: TypeFromInstance<T>,
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

  // Trailing slash avoids a 307 redirect round-trip: the API redirects
  // slash-less collection URLs, doubling every map/search/nearby call.
  const baseURL = buildBaseURL({
    resourcePath: pluralize(type),
    op: 'query',
    identifier: { type },
  });
  const qp = buildQueryParams(mergedQuery, {
    ...defaultOptions.urlParamsSettings,
    ...options?.urlParamsSettings,
  });
  const url = `${baseURL}/?${qp}`;

  const jsonApiObject = jsonApiQuery<T>(type, mergedQuery, mergedOptions);
  return {
    ...jsonApiObject,
    url,
  };
}

function mapQuery<T extends TypedRecordInstance>(
  type: TypeFromInstance<T>,
  bounds: MapBounds,
  options?: ConstrainedRequestOptions
): QueryRequestOptions<{ data: T[] }> {
  return query<T>(
    type,
    {
      'is-highest-duplicates-rating': true,
      keys: [...summaryStationQueryKeys],
      limit: 470,
      'within-pt1-lat': bounds.northEast[1],
      'within-pt1-lon': bounds.northEast[0],
      'within-pt2-lat': bounds.southWest[1],
      'within-pt2-lon': bounds.southWest[0],
    },
    options
  );
}

function nearbyQuery<T extends TypedRecordInstance>(
  type: TypeFromInstance<T>,
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

// Fetches an explicit set of stations (the profile's favorites) by id.
// No duplicates filtering: the user picked these exact stations.
function favoritesQuery<T extends TypedRecordInstance>(
  type: TypeFromInstance<T>,
  ids: string[],
  options?: ConstrainedRequestOptions
): QueryRequestOptions<{ data: T[] }> {
  return query<T>(
    type,
    {
      // Copy: buildQueryParams sorts array params in place for stable cache
      // URLs, and the caller's array is the profile record's favorites.
      ids: [...ids],
      limit: ids.length,
    },
    options
  );
}

function searchQuery<T extends TypedRecordInstance>(
  type: TypeFromInstance<T>,
  search: string,
  near?: Coordinates,
  limit = 8,
  options?: ConstrainedRequestOptions
): QueryRequestOptions<{ data: T[] }> {
  return query<T>(
    type,
    {
      'is-highest-duplicates-rating': true,
      keys: [...summaryStationQueryKeys],
      limit,
      search: search.trim(),
      ...(near && {
        'near-lat': near.latitude,
        'near-lon': near.longitude,
      }),
    },
    options
  );
}

export {
  favoritesQuery,
  findRecord,
  mapQuery,
  nearbyQuery,
  query,
  searchQuery,
};
