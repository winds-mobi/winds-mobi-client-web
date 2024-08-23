import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';

export default class LocationService extends Service {
  @tracked latitude: number | null = 46.68;
  @tracked longitude: number | null = 7.85;

  getLocationTask = task(async () => {
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
      throw new Error('Error fetching location:', error);
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
