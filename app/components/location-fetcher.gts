import { on } from '@ember/modifier';
import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { Button } from '@frontile/buttons';

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
    if (navigator.geolocation) {
      try {
        const position: GeolocationPosition = await new Promise(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          },
        );

        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  });
  <template>
    <Button
      type='button'
      {{on 'click' this.getLocationTask.perform}}
      disabled={{this.getLocationTask.isRunning}}
    >
      {{#if this.getLocationTask.isRunning}}
        <span class='spinner'>Loading...</span>
      {{else}}
        Get Location
      {{/if}}
    </Button>

    {{yield this.latitude this.longitude}}
  </template>
}
