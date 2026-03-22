/* eslint-disable @typescript-eslint/only-throw-error, @typescript-eslint/restrict-plus-operands */
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { TrackedObject } from 'tracked-built-ins';

interface GpsLocation {
  latitude: number;
  longitude: number;
}

export default class LocationService extends Service {
  @tracked gps: GpsLocation | undefined = undefined;

  getLocationFromGps = task(async () => {
    try {
      const position: GeolocationPosition = await new Promise(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      );

      this.gps = new TrackedObject({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      return true;
    } catch (error) {
      throw 'Error fetching location:' + error;
    }
  });
}

// Don't remove this declaration: this is what enables TypeScript to resolve
// this service using `Owner.lookup('service:location')`, as well
// as to check when you pass the service name as an argument to the decorator,
// like `@service('location') declare altName: LocationService;`.
declare module '@ember/service' {
  interface Registry {
    location: LocationService;
  }
}
