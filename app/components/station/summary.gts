import Component from '@glimmer/component';
import Wind from 'ember-phosphor-icons/components/ph-wind';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import Speedometer from 'ember-phosphor-icons/components/ph-speedometer';
import { formatNumber, t } from 'ember-intl';
import type { Station } from 'winds-mobi-client-web/services/store';
import Polar from '../chart/polar';
import windToColour from '../../helpers/wind-to-colour';
import azimuthToCardinal from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import { type IntlService } from 'ember-intl';
import { inject as service } from '@ember/service';

export interface StationSummarySignature {
  Args: {
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class StationSummary extends Component<StationSummarySignature> {
  @service declare intl: IntlService;

  get demo() {
    const now = Date.now();
    const nHoursInMs = 1 * 60 * 60 * 1000;
    return [
      {
        name: 'Wind Direction',
        data: this.args.history.slice(-20).map((elm) => ({
          x: elm.direction,
          y: 1 - (now - elm.timestamp) / nHoursInMs,
          color: windToColour(elm.speed),
          customTooltip: this.intl.formatTime(elm.timestamp, {
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
          }),
        })),
        connectEnds: false,
      },
    ];
  }

  <template>
    <div class='flex flex-row px-2 py-2 sm:p-6'>
      <div class='flex flex-col w-2/3 gap-4'>
        <table class='w-full'>
          <caption class='text-left font-bold'>
            {{t 'station.summary.wind'}}
          </caption>
          <tbody>
            <tr>
              <td>
                {{t 'wind.speed'}}
              </td>
              <td class='text-right'>
                {{formatNumber
                  @station.last.speed
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
                  @station.last.gusts
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
                {{azimuthToCardinal @station.last.direction}}
                ({{t 'format.azimuth' azimuth=@station.last.direction}})
              </td>
            </tr>
          </tbody>
        </table>
        {{!-- <div>
          <a href={{@station.providerUrl.en}}>
            {{@station.providerName}}
          </a>
        </div> --}}
        {{!-- <div>
          <Mountains class='inline' />
          {{formatNumber @station.altitude style='unit' unit='meter'}}
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
                  @station.last.speed
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
                  @station.last.speed
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
                  @station.last.speed
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
                  @station.last.temperature
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
                {{t 'format.percent' value=@station.last.humidity}}
              </td>
            </tr>
            <tr>
              <td>
                {{t 'air.pressure'}}
              </td>
              <td class='text-right'>
                {{t 'format.pressure' value=@station.last.pressure}}
              </td>
            </tr>
            <tr>
              <td>
                {{t 'air.rain'}}
              </td>
              <td class='text-right'>
                {{t 'format.rain' value=@station.last.rain}}
              </td>
            </tr>
          </tbody>
        </table>

      </div>
      <div class='w-1/3 items-start'>
        <Polar @chartData={{this.demo}} @chartOptions={{undefined}} />
      </div>
    </div>
  </template>
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    StationDetails: typeof StationSummary;
  }
}
