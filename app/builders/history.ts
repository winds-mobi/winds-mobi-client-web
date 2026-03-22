import { buildBaseURL, buildQueryParams } from '@warp-drive/utilities';
import type {
  ConstrainedRequestOptions,
  QueryRequestOptions,
} from '@warp-drive/core/types/request';
import type { QueryParamsSource } from '@warp-drive/core/types/params';

import { query as jsonApiQuery } from '@warp-drive/utilities/json-api';

const defaultQuery: QueryParamsSource = {
  keys: ['w-dir', 'w-avg', 'w-max', 'temp', 'hum'],
  duration: 435600,
};

const defaultOptions: ConstrainedRequestOptions = {
  urlParamsSettings: {
    arrayFormat: 'repeat' as const,
  },
};

function historyQuery<T>(
  type: string,
  id: string,
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
  const baseURL = buildBaseURL({
    resourcePath: 'stations',
    op: 'query',
    identifier: { type },
  });
  const qp = buildQueryParams(mergedQuery, {
    ...defaultOptions.urlParamsSettings,
    ...options?.urlParamsSettings,
  });
  const url = `${baseURL}/${id}/historic/?${qp}`;

  const jsonApiObject = jsonApiQuery<T>(type, mergedQuery, mergedOptions);

  return { ...jsonApiObject, url };
}

export { historyQuery };
