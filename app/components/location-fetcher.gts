import { on } from '@ember/modifier';
import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export interface LocationFetcherSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class LocationFetcher extends Component<LocationFetcherSignature> {
  @tracked latitude = 30;
  @tracked longitude = 8;

  @action
  async getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
        },
        (error) => {
          console.error('Error fetching location:', error);
        },
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }
  <template>
    <button type='button' {{on 'click' this.getLocation}}>Get Location</button>

    {{yield this.latitude this.longitude}}
  </template>
}
