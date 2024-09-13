import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import type LocationService from 'winds-mobi-client-web/services/location';
//@ts-expect-error
import { icon } from 'ember-leaflet/helpers/icon';

export interface MapYouAreHereSignature {
  Args: {
    layers: any;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

const youAreHerePin = icon([], {
  iconUrl: '/images/you-are-here.svg',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8],
  // shadowUrl: 'my-icon-shadow.png',
  // shadowSize: [68, 95],
  // shadowAnchor: [22, 94],
});

export default class MapYouAreHere extends Component<MapYouAreHereSignature> {
  @service declare location: LocationService;

  <template>
    {{#if this.location.gps}}
      <@layers.marker
        @lat={{this.location.gps.latitude}}
        @lng={{this.location.gps.longitude}}
        @icon={{youAreHerePin}}
      />
    {{/if}}
  </template>
}
