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
  keys: ['w-dir', 'w-avg', 'w-max'],
  duration: 3600,
};

const defaultOptions = {
  urlParamsSettings: {
    arrayFormat: 'repeat' as const,
  },
};

// Uses standard JSON-API buidler findRecord() and
// enhances it on our own need for query(params)
// and default values
// function findRecord<T>(
//   type: TypeFromInstance<T>,
//   id: string,
//   query?: QueryParamsSource,
//   options?: FindRecordOptions,
// ): FindRecordRequestOptions {
//   const baseURL = buildBaseURL({
//     resourcePath: pluralize(type),
//     op: 'findRecord',
//     identifier: { type, id },
//   });
//   const qp = buildQueryParams(
//     { ...defaultQuery, ...query },
//     { ...defaultOptions.urlParamsSettings, ...options?.urlParamsSettings },
//   );
//   const url = `${baseURL}?${qp}`;

//   const jsonApiObject = jsonApiFindRecord(type, id, options);
//   return {
//     ...jsonApiObject,
//     url,
//   };
// }

// Uses standard JSON-API buidler query() and
// and enhances it by default values
function historyQuery<T>(
  type: TypeFromInstance<T>,
  id: string,
  query?: QueryParamsSource,
  options?: FindRecordOptions,
): QueryRequestOptions {
  const baseURL = buildBaseURL({
    resourcePath: 'stations',
    op: 'query',
    identifier: { type },
  });
  const qp = buildQueryParams(
    { ...defaultQuery, ...query },
    { ...defaultOptions.urlParamsSettings, ...options?.urlParamsSettings },
  );
  const url = `${baseURL}/${id}/historic/?${qp}`;

  const jsonApiObject = jsonApiQuery(
    type,
    { ...defaultQuery, ...query },
    { ...defaultOptions, ...options },
  );

  return { ...jsonApiObject, url };
}

export { historyQuery };
