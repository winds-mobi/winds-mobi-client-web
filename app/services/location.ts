import { action } from '@ember/object';
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import type { LeafletEvent } from 'leaflet';
import { TrackedObject } from 'tracked-built-ins';

interface GpsLocation {
  latitude: number;
  longitude: number;
}

interface MapLocation extends GpsLocation {
  zoom: number;
}

export default class LocationService extends Service {
  map: MapLocation = new TrackedObject({
    latitude: 46.68,
    longitude: 7.85,
    zoom: 13,
  });
  @tracked gps: GpsLocation | undefined = undefined;

  getLocationFromGps = task(async () => {
    try {
      const position: GeolocationPosition = await new Promise(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        },
      );

      this.gps = new TrackedObject({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      // On location (re)load we want to center the map
      this.map.latitude = this.gps.latitude;
      this.map.longitude = this.gps.longitude;

      return true;
    } catch (error) {
      throw 'Error fetching location:' + error;
    }
  });

  @action
  updateLocation(e: LeafletEvent) {
    const { lat: latitude, lng: longitude } = e.target.getCenter();

    // Keep those IFs here otherwise we get into an infinite re-render loop
    if (this.map.latitude != latitude) {
      this.map.latitude = latitude;
    }
    if (this.map.longitude != longitude) {
      this.map.longitude = longitude;
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
