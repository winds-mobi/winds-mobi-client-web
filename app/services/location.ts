import { action } from '@ember/object';
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import type { LeafletEvent } from 'leaflet';

export default class LocationService extends Service {
  @tracked latitude: number | null = 46.68;
  @tracked longitude: number | null = 7.85;

  getLocationFromGps = task(async () => {
    try {
      const position: GeolocationPosition = await new Promise(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        },
      );

      this.latitude = position.coords.latitude;
      this.longitude = position.coords.longitude;

      return true;
    } catch (error) {
      throw new Error('Error fetching location:' + error);
    }
  });

  @action
  updateLocation(e: LeafletEvent) {
    console.log({ e });
    const { lat, lng } = e.target.getCenter();

    if (this.latitude !== lat) {
      this.latitude = lat;
    }

    if (this.longitude !== lng) {
      this.longitude = lng;
    }
  }
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
