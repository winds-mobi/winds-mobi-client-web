import { buildBaseURL, buildQueryParams } from '@ember-data/request-utils';
import { pluralize } from '@ember-data/request-utils/string';
import type { QueryParamsSource } from '@warp-drive/core-types/params';
import type { TypeFromInstance } from '@warp-drive/core-types/record';
import type { FindRecordOptions } from '@warp-drive/core-types/request';

const defaultQuery = {
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
  ],
};

const defaultOptions = {
  urlParamsSettings: {
    arrayFormat: 'repeat' as const,
  },
};

function findRecord<T>(
  type: TypeFromInstance<T>,
  id: string,
  query?: QueryParamsSource,
  options?: FindRecordOptions,
) {
  const baseURL = buildBaseURL({
    resourcePath: pluralize(type),
    op: 'findRecord',
    identifier: { type, id },
  });
  const qp = buildQueryParams(
    { ...defaultQuery, ...query },
    { ...defaultOptions.urlParamsSettings, ...options?.urlParamsSettings },
  );
  const url = `${baseURL}?${qp}`;
  return {
    method: 'GET',
    op: 'findRecord',
    url,
  };
}

export { findRecord };
