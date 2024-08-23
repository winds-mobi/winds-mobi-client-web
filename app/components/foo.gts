import Component from '@glimmer/component';
import { findRecord } from '@ember-data/rest/request';
import { Request } from '@warp-drive/ember';
// import { query } from '@ember-data/rest/request';
import { query } from '@ember-data/json-api/request';
// @ts-expect-error No TS stuff yet
import LeafletMap from 'ember-leaflet/components/leaflet-map';
import { inject as service } from '@ember/service';
import { get } from '@ember/helper';
import { icon } from 'ember-leaflet/helpers/icon';
import { divIcon } from 'ember-leaflet/helpers/div-icon';
import { concat } from '@ember/helper';
import MarkerLayerComponent from './marker-layer.ts';
import Arrow from './arrow';
import type StoreService from 'winds-mobi-client-web/services/store.js';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import LocationFetcher from './location-fetcher';
import type LocationService from 'winds-mobi-client-web/services/location.js';

export interface FooSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class Foo extends Component<FooSignature> {
  @service declare store: StoreService;
  @service declare location: LocationService;

  lat = 30.68;
  lng = 7.853;
  zoom = 13;

  get request() {
    const options = query<Station>(
      'stations',
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
        namespace: '2.3',
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
          style='width: 100%; height: 64em'
          @lat={{this.location.latitude}}
          @lng={{this.location.longitude}}
          @zoom={{this.zoom}}
          as |layers|
        >
          <layers.tile @url='http://{s}.tile.osm.org/{z}/{x}/{y}.png' />

          {{#each result.data as |r|}}
            <Arrow
              @rotate={{get r.last 'w-dir'}}
              @avg={{get r.last 'w-avg'}}
              @max={{get r.last 'w-max'}}
              as |icon|
            >
              <layers.marker
                @lat={{get r.loc.coordinates '1'}}
                @lng={{get r.loc.coordinates '0'}}
                @icon={{icon}}
                as |marker|
              >
                <marker.popup @popupOpen={{false}}>
                  {{get r.last 'w-avg'}}
                  /
                  {{get r.last 'w-max'}}
                </marker.popup>
              </layers.marker>
            </Arrow>
          {{/each}}
        </LeafletMap>
      </:content>
    </Request>
    --
  </template>
}
