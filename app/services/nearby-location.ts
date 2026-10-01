import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import {
  type Coordinates,
  DEFAULT_POSITION_OPTIONS,
} from 'winds-mobi-client-web/utils/location';

// The visitor's position, when known: drawn on the map, used for distances
// and to open the map where they are.
export default class NearbyLocationService extends Service {
  @tracked coordinates?: Coordinates;

  // Only `.coords` is ever read -- the shape MapLibre's own
  // `GeolocatePositionEvent` carries, as well as a real `GeolocationPosition`.
  updateFromPosition(position: { coords: GeolocationCoordinates }) {
    this.coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  }

  // Locates the visitor only if they have already granted geolocation --
  // never prompts. Without a position the map just shows none.
  async locateIfPermitted() {
    if (
      !navigator.geolocation ||
      typeof navigator.permissions?.query !== 'function'
    ) {
      return;
    }

    try {
      const { state } = await navigator.permissions.query({
        name: 'geolocation',
      });

      if (state !== 'granted') {
        return;
      }

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
    } catch {
      // No position: nothing to show.
    }
  }
}

declare module '@ember/service' {
  interface Registry {
    'nearby-location': NearbyLocationService;
  }
}
