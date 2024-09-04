import { buildBaseURL, buildQueryParams } from '@ember-data/request-utils';
import { pluralize } from '@ember-data/request-utils/string';
import type { QueryParamsSource } from '@warp-drive/core-types/params';
import type { TypeFromInstance } from '@warp-drive/core-types/record';
import type {
  FindRecordOptions,
  FindRecordRequestOptions,
  QueryRequestOptions,
} from '@warp-drive/core-types/request';
import { query as jsonApiQuery } from '@ember-data/json-api/request';
import { findRecord as jsonApiFindRecord } from '@ember-data/json-api/request';

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
    'last.hum',
  ],
};

const defaultOptions = {
  urlParamsSettings: {
    arrayFormat: 'repeat' as const,
  },
};

// Uses standard JSON-API buidler findRecord() and
// enhances it on our own need for query(params)
// and default values
function findRecord<T>(
  type: TypeFromInstance<T>,
  id: string,
  query?: QueryParamsSource,
  options?: FindRecordOptions,
): FindRecordRequestOptions {
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

  const jsonApiObject = jsonApiFindRecord(type, id, options);
  return {
    ...jsonApiObject,
    url,
  };
}

// Uses standard JSON-API buidler query() and
// and enhances it by default values
function query<T>(
  type: TypeFromInstance<T>,
  query?: QueryParamsSource,
  options?: FindRecordOptions,
): QueryRequestOptions {
  return jsonApiQuery(
    type,
    { ...defaultQuery, ...query },
    { ...defaultOptions, ...options },
  );
}

export { findRecord, query };
