import Component from '@glimmer/component';
import type StoreService from 'winds-mobi-client-web/services/store.js';
import Wind from 'ember-phosphor-icons/components/ph-wind';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import Speedometer from 'ember-phosphor-icons/components/ph-speedometer';
import { formatNumber } from 'ember-intl';
// import { findRecord } from '@ember-data/json-api/request';
import { findRecord } from 'winds-mobi-client-web/builders/station';
import { Request } from '@warp-drive/ember';
import type { Station, History } from 'winds-mobi-client-web/services/store.js';
import { inject as service } from '@ember/service';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import { CloseButton } from '@frontile/buttons';
import StationWinds from './winds';
import { action } from '@ember/object';
import type RouterService from '@ember/routing/router-service';
import { on } from '@ember/modifier';

export interface StationIndexSignature {
  Args: {
    stationId: string;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationIndex extends Component<StationIndexSignature> {
  @service declare store: StoreService;
  @service declare router: RouterService;

  get stationRequest() {
    const options = findRecord<Station>('station', this.args.stationId);
    return this.store.request(options);
  }

  get historyRequest() {
    const options = historyQuery<History>('history', this.args.stationId);
    return this.store.request(options);
  }

  @action
  close() {
    this.router.transitionTo('map');
  }

  <template>
    <Request @request={{this.stationRequest}}>
      <:loading>
        ---
      </:loading>

      <:content as |result state|>
        <div
          class='bg-gray-50 border-t-4 border-l-4 border-r-4 border-slate-400 rounded-t-xl'
        >
          <CloseButton {{on 'click' this.close}} class='float-right' />
          <div class='px-4 py-5 sm:p-6'>

            <div class='flex flex-col'>
              <div class='font-bold text-lg'>
                {{! <Heart class='inline' /> }}
                {{result.data.name}}
              </div>
              <div>
                <Mountains class='inline' />
                {{formatNumber result.data.altitude style='unit' unit='meter'}}
              </div>
              <div>
                <Wind class='inline' />
                {{formatNumber
                  result.data.last.speed
                  style='unit'
                  unit='kilometer-per-hour'
                }}
              </div>
              <div>
                <Speedometer class='inline' />
                {{formatNumber
                  result.data.last.gusts
                  style='unit'
                  unit='kilometer-per-hour'
                }}
              </div>
              <div>
                <a href={{result.data.providerUrl.en}}>
                  {{result.data.providerName}}
                </a>
              </div>
              <div>
                {{formatNumber
                  result.data.last.temperature
                  style='unit'
                  unit='celsius'
                }}
              </div>
              <div>
                <Request @request={{this.historyRequest}}>
                  <:content as |result state|>
                    <StationWinds @history={{result.data}} />

                  </:content>
                </Request>
              </div>
            </div>
            {{! Content goes here }}
          </div>
        </div>
      </:content>
    </Request>
  </template>
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    Station: typeof StationIndex;
  }
}
