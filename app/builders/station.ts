import { buildBaseURL, buildQueryParams } from '@ember-data/request-utils';
import { pluralize } from '@ember-data/request-utils/string';
import type { QueryParamsSource } from '@warp-drive/core-types/params';
import type { TypeFromInstance } from '@warp-drive/core-types/record';
import type { FindRecordOptions } from '@warp-drive/core-types/request';

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
  const url = `${baseURL}?${buildQueryParams(query || {}, options?.urlParamsSettings)}`;
  return {
    method: 'GET',
    op: 'findRecord',
    url,
  };
}

export { findRecord };
