import Route from '@ember/routing/route';
import { service } from '@ember/service';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';

export default class NearbyRoute extends Route {
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;

  override async beforeModel(): Promise<void> {
    await this.nearbyLocation.syncPermissionState();
  }
}
