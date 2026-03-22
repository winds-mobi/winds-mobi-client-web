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

export { findRecord, query };
