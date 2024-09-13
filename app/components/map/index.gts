import Component from '@glimmer/component';
import { Request } from '@warp-drive/ember';
// import { query } from '@ember-data/rest/request';
// import { query } from '@ember-data/json-api/request';
import { query } from 'winds-mobi-client-web/builders/station';
// @ts-expect-error No TS stuff yet
import LeafletMap from 'ember-leaflet/components/leaflet-map';
import { inject as service } from '@ember/service';
import Arrow from './arrow';
import type StoreService from 'winds-mobi-client-web/services/store.js';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import type LocationService from 'winds-mobi-client-web/services/location.js';
import Popover from './popover';
import { action } from '@ember/object';
import type RouterService from '@ember/routing/router-service';
import { fn } from '@ember/helper';
import YouAreHere from './you-are-here';

export interface MapSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class Map extends Component<MapSignature> {
  @service declare store: StoreService;
  @service declare location: LocationService;
  @service declare router: RouterService;

  get request() {
    const options = query<Station>('station', {
      limit: 12,
      'near-lat': this.location.map.latitude,
      'near-lon': this.location.map.longitude,
    });
    return this.store.request(options);
  }

  @action stationSelected(stationId: string) {
    this.router.transitionTo('map.station', stationId);
  }

  <template>
    <LeafletMap
      class='w-full h-full'
      @lat={{this.location.map.latitude}}
      @lng={{this.location.map.longitude}}
      @zoom={{this.location.map.zoom}}
      @onMoveend={{this.location.updateLocation}}
      as |layers|
    >
      <layers.tile @url='http://{s}.tile.osm.org/{z}/{x}/{y}.png' />

      <YouAreHere @layers={{layers}} />

      <Request @request={{this.request}}>
        <:loading>
          ---
        </:loading>

        <:content as |result state|>
          {{#each result.data as |r|}}
            <Arrow @speed={{r.last.speed}} @gusts={{r.last.gusts}} as |icon|>
              <layers.rotated-marker
                @lat={{r.latitude}}
                @lng={{r.longitude}}
                @icon={{icon}}
                @rotationAngle={{r.last.direction}}
                @onClick={{fn this.stationSelected r.id}}
                as |marker|
              >
                <marker.popup @popupOpen={{false}}>
                  <Popover @station={{r}} />
                </marker.popup>
              </layers.rotated-marker>
            </Arrow>
          {{/each}}
        </:content>
      </Request>
    </LeafletMap>
  </template>
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    Map: typeof Map;
  }
}
