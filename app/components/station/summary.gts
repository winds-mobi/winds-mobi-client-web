import Component from '@glimmer/component';
import { formatNumber, t } from 'ember-intl';
import azimuthToCardinal from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import type { History, Station } from 'winds-mobi-client-web/services/store.js';
import WindDirection from './wind-direction';
import RelativeTime from '../relative-time';

export interface StationSummarySignature {
  Args: {
    history: History[];
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationSummary extends Component<StationSummarySignature> {
  <template>
    <section data-test-station-summary-section class="px-4 py-5 sm:px-6">
      <h2 class="text-base font-semibold text-slate-900">
        {{t "station.summary.title"}}
      </h2>

      <div
        class="mt-4 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(14rem,1fr)]"
      >
        <div class="flex min-w-0 flex-col gap-6">
          <table class="w-full">
            <caption class="text-left font-bold">
              {{t "station.summary.wind"}}
            </caption>
            <tbody>
              <tr>
                <td>
                  {{t "wind.timestamp"}}
                </td>
                <td class="text-right">
                  <RelativeTime @timestamp={{@station.last.timestamp}} />
                </td>
              </tr>
              <tr>
                <td>
                  {{t "wind.speed"}}
                </td>
                <td class="text-right">
                  {{formatNumber
                    @station.last.speed
                    style="unit"
                    unit="kilometer-per-hour"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  {{t "wind.gusts"}}
                </td>
                <td class="text-right">
                  {{formatNumber
                    @station.last.gusts
                    style="unit"
                    unit="kilometer-per-hour"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  {{t "wind.direction"}}
                </td>
                <td class="text-right">
                  {{azimuthToCardinal @station.last.direction}}
                  ({{t "format.azimuth" azimuth=@station.last.direction}})
                </td>
              </tr>
            </tbody>
          </table>

          <table class="w-full">
            <caption class="text-left font-bold">
              {{t "station.summary.air"}}
            </caption>
            <tbody>
              <tr>
                <td>
                  {{t "air.temperature"}}
                </td>
                <td class="text-right">
                  {{formatNumber
                    @station.last.temperature
                    style="unit"
                    unit="celsius"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  {{t "air.humidity"}}
                </td>
                <td class="text-right">
                  {{t "format.percent" value=@station.last.humidity}}
                </td>
              </tr>
              <tr>
                <td>
                  {{t "air.pressure"}}
                </td>
                <td class="text-right">
                  {{t "format.pressure" value=@station.last.pressure}}
                </td>
              </tr>
              <tr>
                <td>
                  {{t "air.rain"}}
                </td>
                <td class="text-right">
                  {{t "format.rain" value=@station.last.rain}}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="min-w-0">
          <WindDirection @data={{@history}} />
        </div>
      </div>
    </section>
  </template>
}
