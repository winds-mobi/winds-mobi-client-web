import Component from '@glimmer/component';
import type StoreService from 'winds-mobi-client-web/services/store.js';
import Wind from 'ember-phosphor-icons/components/ph-wind';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import Speedometer from 'ember-phosphor-icons/components/ph-speedometer';
import { formatNumber } from 'ember-intl';
import { query } from '@ember-data/json-api/request';
import { findRecord } from '@ember-data/json-api/request';
import { Request } from '@warp-drive/ember';
import { inject as service } from '@ember/service';

export interface StationIndexSignature {
  Args: {
    stationId: string;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class Station extends Component<StationIndexSignature> {
  @service declare store: StoreService;

  get request() {
    const options = findRecord<Station>('station', this.args.stationId, {
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
    });
    return this.store.request(options);
  }

  <template>
    <Request @request={{this.request}}>
      <:loading>
        ---
      </:loading>

      <:content as |result state|>
        {{log result.data.altitude}}
        {{log result.data}}
        {{log state}}
        {{log this.args.stationId}}

        {{!-- <div class='flex flex-col'>
          <div>
            {{! <Heart class='inline' /> }}
            {{@station.name}}
          </div>
          <div>
            <Mountains class='inline' />
            {{formatNumber @station.altitude style='unit' unit='meter'}}
          </div>
          <div>
            <Wind class='inline' />
            {{formatNumber
              @station.last.speed
              style='unit'
              unit='kilometer-per-hour'
            }}
          </div>
          <div>
            <Speedometer class='inline' />
            {{formatNumber
              @station.last.gusts
              style='unit'
              unit='kilometer-per-hour'
            }}
          </div>
          <div>
        {{@station.providerName}}
      </div>
        </div> --}}
      </:content>
    </Request>
  </template>
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    Station: typeof Station;
  }
}
