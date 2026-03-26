import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { DEFAULT_POSITION_OPTIONS } from 'winds-mobi-client-web/utils/location';

export type NearbyCoordinates = {
  accuracy: number;
  latitude: number;
  longitude: number;
};

export type NearbyLocationErrorCode =
  | 'permission-denied'
  | 'position-unavailable'
  | 'timeout'
  | 'unsupported'
  | 'unknown';

type NearbyPermissionState = PermissionState | 'checking' | 'unsupported';
type NearbyRequestState = 'idle' | 'requesting' | 'ready' | 'error';

const GEOLOCATION_PERMISSION_DENIED = 1;
const GEOLOCATION_POSITION_UNAVAILABLE = 2;
const GEOLOCATION_TIMEOUT = 3;

export default class NearbyLocationService extends Service {
  @tracked coordinates?: NearbyCoordinates;
  @tracked errorCode?: NearbyLocationErrorCode;
  @tracked permissionState: NearbyPermissionState = 'checking';
  @tracked requestState: NearbyRequestState = 'idle';

  #permissionStatus?: PermissionStatus;
  #hasSyncedPermissionState = false;

  get hasCoordinates() {
    return this.coordinates !== undefined;
  }

  get isCheckingPermission() {
    return this.permissionState === 'checking';
  }

  get isRequestingLocation() {
    return this.requestState === 'requesting';
  }

  get canRequestLocation() {
    return (
      this.permissionState !== 'unsupported' &&
      this.requestState !== 'requesting'
    );
  }

  beginLocationRequest() {
    this.errorCode = undefined;
    this.requestState = 'requesting';
  }

  updateFromPosition(position: GeolocationPosition) {
    this.coordinates = {
      accuracy: position.coords.accuracy,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    this.errorCode = undefined;
    this.permissionState = 'granted';
    this.requestState = 'ready';
  }

  updateFromError(error?: GeolocationPositionError) {
    this.errorCode = this.#mapErrorCode(error);
    this.requestState = 'error';

    if (this.errorCode === 'permission-denied') {
      this.permissionState = 'denied';
    }
  }

  async syncPermissionState() {
    if (this.#hasSyncedPermissionState) {
      return;
    }

    this.#hasSyncedPermissionState = true;

    if (!this.#hasGeolocationSupport()) {
      this.permissionState = 'unsupported';
      this.errorCode = 'unsupported';

      return;
    }

    if (typeof navigator.permissions?.query !== 'function') {
      this.permissionState = 'prompt';

      return;
    }

    try {
      const permissionStatus = await navigator.permissions.query({
        name: 'geolocation',
      } as PermissionDescriptor);

      this.#permissionStatus = permissionStatus;
      this.#permissionStatus.onchange = () => {
        this.permissionState = permissionStatus.state;
      };
      this.permissionState = permissionStatus.state;

      if (permissionStatus.state === 'granted' && !this.hasCoordinates) {
        await this.requestCurrentPosition();
      }
    } catch {
      this.permissionState = 'prompt';
    }
  }

  async requestCurrentPosition() {
    if (!this.#hasGeolocationSupport()) {
      this.permissionState = 'unsupported';
      this.errorCode = 'unsupported';
      this.requestState = 'error';

      return;
    }

    this.beginLocationRequest();

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            DEFAULT_POSITION_OPTIONS
          );
        }
      );

      this.updateFromPosition(position);
    } catch (error) {
      this.updateFromError(error as GeolocationPositionError | undefined);
    }
  }

  willDestroy(): void {
    super.willDestroy();

    if (this.#permissionStatus) {
      this.#permissionStatus.onchange = null;
    }
  }

  #hasGeolocationSupport() {
    return (
      typeof navigator !== 'undefined' && navigator.geolocation !== undefined
    );
  }

  #mapErrorCode(error?: GeolocationPositionError): NearbyLocationErrorCode {
    switch (error?.code) {
      case GEOLOCATION_PERMISSION_DENIED:
        return 'permission-denied';
      case GEOLOCATION_POSITION_UNAVAILABLE:
        return 'position-unavailable';
      case GEOLOCATION_TIMEOUT:
        return 'timeout';
      default:
        return 'unknown';
    }
  }
}

declare module '@ember/service' {
  interface Registry {
    'nearby-location': NearbyLocationService;
  }
}
