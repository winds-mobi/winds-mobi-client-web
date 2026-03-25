import type { NearbyLocationErrorCode } from 'winds-mobi-client-web/services/nearby-location';

const ERROR_TRANSLATION_SUFFIXES: Record<NearbyLocationErrorCode, string> = {
  'permission-denied': 'permissionDenied',
  'position-unavailable': 'positionUnavailable',
  timeout: 'timeout',
  unsupported: 'unsupported',
  unknown: 'unknownError',
};

export function locationErrorTranslationKey(
  baseKey: string,
  errorCode?: NearbyLocationErrorCode
) {
  return errorCode
    ? `${baseKey}.${ERROR_TRANSLATION_SUFFIXES[errorCode]}`
    : undefined;
}
