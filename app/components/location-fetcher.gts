import { on } from '@ember/modifier';
import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { Button } from '@frontile/buttons';
import Gps from 'ember-phosphor-icons/components/ph-gps';
import GpsFix from 'ember-phosphor-icons/components/ph-gps-fix';
import GpsSlash from 'ember-phosphor-icons/components/ph-gps-slash';

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

export interface LocationFetcherSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class LocationFetcher extends Component<LocationFetcherSignature> {
  @tracked latitude: number | null = 30;
  @tracked longitude: number | null = 7;

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
  <template>
    <Button
      type='button'
      {{on 'click' this.getLocationTask.perform}}
      disabled={{this.getLocationTask.isRunning}}
    >
      {{log this.getLocationTask.last.isSuccessful}}
      {{log this.getLocationTask.last.value}}

      {{#if this.getLocationTask.last.value}}
        <GpsFix />
      {{else}}
        {{#if this.getLocationTask.last.isError}}
          <GpsSlash />
        {{else}}
          <Gps class={{if this.getLocationTask.isRunning 'animate-pulse'}} />
        {{/if}}
      {{/if}}

      Get Location
    </Button>

    {{yield this.latitude this.longitude}}
  </template>
}
