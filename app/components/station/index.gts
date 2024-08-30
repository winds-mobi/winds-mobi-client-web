import Component from '@glimmer/component';
import type StoreService from 'winds-mobi-client-web/services/store.js';

// import { findRecord } from '@ember-data/json-api/request';
import { findRecord } from 'winds-mobi-client-web/builders/station';
import { Request } from '@warp-drive/ember';
import type { Station, History } from 'winds-mobi-client-web/services/store.js';
import { inject as service } from '@ember/service';
import { historyQuery } from 'winds-mobi-client-web/builders/history';
import { CloseButton } from '@frontile/buttons';

import { action } from '@ember/object';
import type RouterService from '@ember/routing/router-service';
import { on } from '@ember/modifier';
import StationSummary from './summary';
import StationWinds from './winds';
import { LinkTo } from '@ember/routing';
import { t } from 'ember-intl';
import { eq } from 'ember-truth-helpers';

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

          <div class='border-b border-gray-200'>
            <nav class='-mb-px flex w-full' aria-label='Tabs'>
              <LinkTo
                @route='map.station.summary'
                class='flex-1 border-b-2 px-1 py-4 text-center text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700'
                @activeClass='border-indigo-500 text-indigo-600'
              >{{t 'station.summary'}}</LinkTo>
              <LinkTo
                @route='map.station.winds'
                class='flex-1 border-b-2 px-1 py-4 text-center text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700'
                @activeClass='border-indigo-500 text-indigo-600'
              >{{t 'station.wind'}}</LinkTo>
              <LinkTo
                @route='map.station.air'
                class='flex-1 border-b-2 px-1 py-4 text-center text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700'
                aria-current='page'
                @activeClass='border-indigo-500 text-indigo-600'
              >{{t 'station.air'}}</LinkTo>
            </nav>
          </div>

          <div class='px-4 py-5 sm:p-6'>
            {{#if (eq this.router.currentRouteName 'map.station.summary')}}
              <StationSummary @station={{result.data}} />
            {{else if (eq this.router.currentRouteName 'map.station.winds')}}
              <Request @request={{this.historyRequest}}>
                <:content as |result state|>
                  <StationWinds @history={{result.data}} />

                </:content>
              </Request>

            {{else if
              (eq this.router.currentRouteName 'map.station.air')
            }}{{/if}}

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
