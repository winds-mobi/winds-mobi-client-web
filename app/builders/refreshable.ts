import type { CacheOptions } from '@warp-drive/core/types/request';

// Marks a request as on-screen data the shared refresh keeps current (see
// app/services/refresh.ts): the refresh service invalidates it by type,
// and its network fetches count as refreshes. One-off lookups (search) stay
// unmarked.
export function refreshable<R extends { cacheOptions?: CacheOptions }>(
  request: R,
  type: string
): R {
  return {
    ...request,
    cacheOptions: { ...request.cacheOptions, types: [type] },
  };
}
