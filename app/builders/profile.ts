// TODO: Remove login — backs the disabled sign-in feature (see
// app/services/session.ts); favorites now persist locally instead (see
// app/services/favorites.ts). Depends on the `Profile` type and
// `ProfileSchema`, both commented out in app/services/store.ts — restore
// those first. Kept for reference/restoration.
import { SkipCache } from '@warp-drive/core/types/request';
import type { QueryRequestOptions } from '@warp-drive/core/types/request';
import { userApiUrl } from 'winds-mobi-client-web/utils/user-api';
import type { Profile } from 'winds-mobi-client-web/services/store';

function jsonHeaders(): Headers {
  const headers = new Headers();

  headers.set('accept', 'application/json');

  return headers;
}

// GET /user/profile/ — the authenticated user's profile. The user handler
// injects the Authorization header and reshapes the payload to JSON:API.
function profileQuery(): QueryRequestOptions<{ data: Profile }> {
  return {
    url: userApiUrl('profile/'),
    method: 'GET',
    headers: jsonHeaders(),
    op: 'query',
    cacheOptions: { types: ['profile'] },
  };
}

function addFavorite(stationId: string) {
  return favoriteMutation('POST', stationId);
}

function removeFavorite(stationId: string) {
  return favoriteMutation('DELETE', stationId);
}

// POST/DELETE /user/profile/favorites/<station_id>/ answers 204 with no
// body, so the cache is skipped entirely; callers refetch the profile to
// pick up the new favorites list.
function favoriteMutation(method: 'DELETE' | 'POST', stationId: string) {
  return {
    url: userApiUrl(`profile/favorites/${encodeURIComponent(stationId)}/`),
    method,
    headers: jsonHeaders(),
    cacheOptions: { [SkipCache]: true as const },
  };
}

export { addFavorite, profileQuery, removeFavorite };
