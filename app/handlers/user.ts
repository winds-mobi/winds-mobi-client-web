import type { Handler, NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';
import { getAuthToken } from 'winds-mobi-client-web/utils/auth-token';
import { userApiUrl } from 'winds-mobi-client-web/utils/user-api';
import { toJsonApiEnvelope } from './json-api';

interface ProfileApiPayload {
  _id: string;
  favorites?: string[];
  picture?: string;
  'display-name'?: string;
}

interface ProfileResponse {
  content: ProfileApiPayload;
}

const USER_API_PREFIX = userApiUrl('');
const PROFILE_URL = userApiUrl('profile/');

function hasOwn<T extends object>(obj: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function jsonApifyProfile(elm: ProfileApiPayload) {
  const attributes: Record<string, unknown> = {
    // The profile is always fetched whole (no sparse fieldsets), so unlike
    // station attributes a missing list simply means "no favorites yet" —
    // default it so consumers always read an array.
    favorites: elm.favorites ?? [],
  };

  if (hasOwn(elm, 'picture')) {
    attributes.picture = elm.picture;
  }

  if (hasOwn(elm, 'display-name')) {
    attributes.displayName = elm['display-name'];
  }

  return {
    type: 'profile',
    id: elm._id,
    attributes,
  };
}

// Owns every request against the winds-mobi-admin user API: injects the
// session JWT as the Authorization header (the backend accepts any two-part
// value and only reads the second word) and reshapes the profile read into
// JSON:API. Favorites mutations pass through — they answer 204 No Content.
const UserHandler: Handler = {
  async request<T>(context: RequestContext, next: NextFn<T>) {
    const url = context.request.url ?? '';

    if (!url.startsWith(USER_API_PREFIX)) {
      return next(context.request);
    }

    const headers = new Headers(context.request.headers);
    const token = getAuthToken();

    if (token) {
      headers.set('authorization', `JWT ${token}`);
    }

    const request = { ...context.request, headers };
    const isProfileRead =
      url === PROFILE_URL && (context.request.method ?? 'GET') === 'GET';

    if (!isProfileRead) {
      return next(request);
    }

    const { content } = (await next(request)) as ProfileResponse;

    return toJsonApiEnvelope<T>(url, jsonApifyProfile(content));
  },
};

export default UserHandler;
