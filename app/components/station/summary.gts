import Component from '@glimmer/component';
import { formatNumber, t } from 'ember-intl';
import azimuthToCardinal from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import { type IntlService } from 'ember-intl';
import { inject as service } from '@ember/service';
import { findRecord } from 'winds-mobi-client-web/builders/station';
import { Request } from '@warp-drive/ember';
import type StoreService from 'winds-mobi-client-web/services/store.js';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import WindDirection from './wind-direction';
import RelativeTime from '../relative-time';

export interface StationSummarySignature {
  Args: {
    stationId: string;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationSummary extends Component<StationSummarySignature> {
  @service declare intl: IntlService;
  @service declare store: StoreService;

  get stationRequest() {
    const options = findRecord<Station>('station', this.args.stationId);
    return this.store.request(options);
  }

  <template>
    <div class='flex flex-row px-2 py-2 sm:p-6'>
      <div class='flex flex-col w-2/3 gap-4'>
        <Request @request={{this.stationRequest}}>
          <:loading>
            ---
          </:loading>

          <:content as |stationResult|>
            {{#let stationResult.data as |station|}}
              <table class='w-full'>
                <caption class='text-left font-bold'>
                  {{t 'station.summary.wind'}}
                </caption>
                <tbody>
                  <tr>
                    <td>
                      {{t 'wind.timestamp'}}
                    </td>
                    <td class='text-right'>
                      <RelativeTime @timestamp={{station.last.timestamp}} />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {{t 'wind.speed'}}
                    </td>
                    <td class='text-right'>
                      {{formatNumber
                        station.last.speed
                        style='unit'
                        unit='kilometer-per-hour'
                      }}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {{t 'wind.gusts'}}
                    </td>
                    <td class='text-right'>
                      {{formatNumber
                        station.last.gusts
                        style='unit'
                        unit='kilometer-per-hour'
                      }}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {{t 'wind.direction'}}
                    </td>
                    <td class='text-right'>
                      {{azimuthToCardinal station.last.direction}}
                      ({{t 'format.azimuth' azimuth=station.last.direction}})
                    </td>
                  </tr>
                </tbody>
              </table>
              {{!-- <div>
          <a href={{station.providerUrl.en}}>
            {{station.providerName}}
          </a>
        </div> --}}
              {{!-- <div>
          <Mountains class='inline' />
          {{formatNumber station.altitude style='unit' unit='meter'}}
        </div> --}}

              <table class='w-full'>
                <caption class='text-left font-bold'>
                  {{t 'station.summary.wind-last-hour'}}
                </caption>
                <tbody>
                  <tr>
                    <td>
                      {{t 'wind.minimum'}}
                    </td>
                    <td class='text-right'>
                      {{!-- {{formatNumber
                  station.last.speed
                  style='unit'
                  unit='kilometer-per-hour'
                }} --}}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {{t 'wind.mean'}}
                    </td>
                    <td class='text-right'>
                      {{!-- {{formatNumber
                  station.last.speed
                  style='unit'
                  unit='kilometer-per-hour'
                }} --}}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {{t 'wind.maximum'}}
                    </td>
                    <td class='text-right'>
                      {{!-- {{formatNumber
                  station.last.speed
                  style='unit'
                  unit='kilometer-per-hour'
                }} --}}
                    </td>
                  </tr>
                </tbody>
              </table>

              <table class='w-full'>
                <caption class='text-left font-bold'>
                  {{t 'station.summary.air'}}
                </caption>
                <tbody>
                  <tr>
                    <td>
                      {{t 'air.temperature'}}
                    </td>
                    <td class='text-right'>
                      {{formatNumber
                        station.last.temperature
                        style='unit'
                        unit='celsius'
                      }}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {{t 'air.humidity'}}
                    </td>
                    <td class='text-right'>
                      {{t 'format.percent' value=station.last.humidity}}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {{t 'air.pressure'}}
                    </td>
                    <td class='text-right'>
                      {{t 'format.pressure' value=station.last.pressure}}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {{t 'air.rain'}}
                    </td>
                    <td class='text-right'>
                      {{t 'format.rain' value=station.last.rain}}
                    </td>
                  </tr>
                </tbody>
              </table>
            {{/let}}
          </:content>
        </Request>
      </div>
      <div class='w-1/3 items-start'>
        <WindDirection @stationId={{@stationId}} />
      </div>
    </div>
  </template>
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    StationDetails: typeof StationSummary;
  }
}
