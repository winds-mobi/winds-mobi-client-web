import Component from '@glimmer/component';
import { findRecord } from '@ember-data/rest/request';
import { query } from '@ember-data/rest/request';
// @ts-expect-error No TS stuff yet
import LeafletMap from 'ember-leaflet/components/leaflet-map';
import { inject as service } from '@ember/service';

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

  data = [];

  lat = 46.68;
  lng = 7.853;
  zoom = 13;

  constructor() {
    super(...arguments);
    // const options = findRecord('ember-developer', '1', { include: ['pets', 'friends'] });
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
    this.data = this.myStore.request(options);
  }
  <template>
    {{log this.data}}

    --
    <LeafletMap
      style='width: 100%; height: 64em'
      @lat={{this.lat}}
      @lng={{this.lng}}
      @zoom={{this.zoom}}
      as |layers|
    >
      <layers.tile @url='http://{s}.tile.osm.org/{z}/{x}/{y}.png' />

      {{#each this.data as |r|}}
        <layers.marker
          @lat={{r.loc.coordinates.[1]}}
          @lng={{r.loc.coordinates.[0]}}
          as |marker|
        />
      {{/each}}
    </LeafletMap>
    --
  </template>
}
