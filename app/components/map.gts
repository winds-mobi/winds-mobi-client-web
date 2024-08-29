import Component from '@glimmer/component';
import { Request } from '@warp-drive/ember';
// import { query } from '@ember-data/rest/request';
import { query } from '@ember-data/json-api/request';
// @ts-expect-error No TS stuff yet
import LeafletMap from 'ember-leaflet/components/leaflet-map';
import { inject as service } from '@ember/service';
import Arrow from './arrow';
import type StoreService from 'winds-mobi-client-web/services/store.js';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import type LocationService from 'winds-mobi-client-web/services/location.js';
import Details from './details';
import { Drawer } from '@frontile/overlays';

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

  lat = 30.68;
  lng = 7.853;
  zoom = 13;

  get request() {
    const options = query<Station>(
      'station',
      {
        keys: [
          'short',
          'loc',
          'status',
          'pv-name',
          'alt',
          'peak',
          'last._id',
          'last.w-dir',
          'last.w-avg',
          'last.w-max',
        ],
        limit: 12,
        'near-lat': 46.68032645342222,
        'near-lon': 7.853595728058556,
      },
      {
        urlParamsSettings: {
          arrayFormat: 'repeat',
        },
      },
    );
    return this.store.request(options);
  }

  <template>
    <Request @request={{this.request}}>
      <:loading>
        ---
      </:loading>

      <:content as |result state|>
        <LeafletMap
          class='w-full h-full'
          @lat={{this.location.latitude}}
          @lng={{this.location.longitude}}
          @zoom={{this.zoom}}
          as |layers|
        >
          <layers.tile @url='http://{s}.tile.osm.org/{z}/{x}/{y}.png' />

          {{#each result.data as |r|}}
            <Arrow
              @direction={{r.last.direction}}
              @speed={{r.last.speed}}
              @gusts={{r.last.gusts}}
              as |icon|
            >
              <layers.marker
                @lat={{r.latitude}}
                @lng={{r.longitude}}
                @icon={{icon}}
                as |marker|
              >
                <marker.popup @popupOpen={{false}}>
                  <Details @station={{r}} />
                </marker.popup>
              </layers.marker>
            </Arrow>
          {{/each}}
        </LeafletMap>
      </:content>
    </Request>
  </template>
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    Map: typeof Map;
  }
}
