import Component from '@glimmer/component';
import { findRecord } from '@ember-data/rest/request';
import { Request } from '@warp-drive/ember';
import { query } from '@ember-data/rest/request';
// @ts-expect-error No TS stuff yet
import LeafletMap from 'ember-leaflet/components/leaflet-map';
import { inject as service } from '@ember/service';
import { get } from '@ember/helper';
import { icon } from 'ember-leaflet/helpers/icon';
import { divIcon } from 'ember-leaflet/helpers/div-icon';
import { concat } from '@ember/helper';
import MarkerLayerComponent from './marker-layer.ts';

const arrowIcon = icon([], {
  iconUrl: '/images/arrow.png',
  iconSize: [24, 24],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
  style: 'bg-color: red',
  class: 'bar',
  className: 'rotate-[17deg]',
});

const customIcon = divIcon([], {
  iconUrl: '/images/arrow.png',
  iconSize: [24, 24],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
  style: 'bg-color: red',
  class: 'bar',
  html: '<div class="rotate-[17deg] w-full h-full "><img class="w-full h-full" src="/images/arrow.png" /></div>',
});

export interface FooSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class Foo extends Component<FooSignature> {
  @service myStore;

  // https://winds.mobi/api/2.3/stations/?keys=short&keys=loc&keys=status&keys=pv-name&keys=alt&keys=peak&keys=last._id&keys=last.w-dir&keys=last.w-avg&keys=last.w-max&limit=12&near-lat=46.68032645342222&near-lon=7.853595728058556

  //

  lat = 46.68;
  lng = 7.853;
  zoom = 13;

  get request() {
    const options = query(
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
    return this.myStore.request(options);
  }

  <template>
    before
    <span class='rotate-[17deg]'>mirek</span>
    after

    <Request @request={{this.request}}>
      <:loading>
        ---
      </:loading>

      <:content as |result state|>

        {{log '--' result}}

        --
        <LeafletMap
          style='width: 100%; height: 64em'
          @lat={{this.lat}}
          @lng={{this.lng}}
          @zoom={{this.zoom}}
          as |layers|
        >
          <layers.tile @url='http://{s}.tile.osm.org/{z}/{x}/{y}.png' />

          {{#each result.data as |r|}}

            <layers.marker
              @lat={{get r.loc.coordinates '1'}}
              @lng={{get r.loc.coordinates '0'}}
              @icon={{customIcon}}
            />

            {{!-- <layers.marker
                @lat={{get r.loc.coordinates '1'}}
                @lng={{get r.loc.coordinates '0'}}
                @icon={{arrowIcon}}
                @rotationAngle={{get r.last 'w-dir'}}
              />

              <MarkerLayerComponent
                @lat={{get r.loc.coordinates '1'}}
                @lng={{get r.loc.coordinates '0'}}
                @icon={{arrowIcon}}
                @rotationAngle={{get r.last 'w-dir'}}
              /> --}}

          {{/each}}
        </LeafletMap>
      </:content>
    </Request>
    --
  </template>
}
