import Component from '@glimmer/component';
import Wind from 'ember-phosphor-icons/components/ph-wind';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import Speedometer from 'ember-phosphor-icons/components/ph-speedometer';
import { formatNumber, t } from 'ember-intl';
import type { Station } from 'winds-mobi-client-web/services/store';
import Polar from '../chart/polar';
import windToColour from '../../helpers/wind-to-colour';
import azimuthToCardinal from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';

export interface StationSummarySignature {
  Args: {
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

const COLORS = ['red', 'green', 'blue', 'orange', 'yellow'];

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class StationSummary extends Component<StationSummarySignature> {
  get demo() {
    const now = Date.now();
    const sixHoursInMs = 2 * 60 * 60 * 1000;
    return [
      {
        name: 'Wind Direction',
        // data: [
        //   // Example wind direction data
        //   [0, 0.1],
        //   [45, 0.2],
        //   [90, 0.3],
        //   [135, 0.4],
        //   [180, 0.5],
        //   [225, 0.6],
        //   [270, 0.7],
        //   [315, 0.8],
        //   [360, 20],
        // ],
        data: this.args.history.slice(-20).map((elm) => ({
          x: elm.direction,
          y: 1 - (now - elm.timestamp) / sixHoursInMs,
          color: windToColour(elm.speed),
        })),
        // pointStart: 0,
        // pointInterval: 45,
        connectEnds: false,
      },
    ];
  }

  <template>
    <div class='flex flex-col sm:flex-row flex-wrap px-4 py-5 sm:p-6'>
      <div class='flex flex-col w-full sm:w-1/2 gap-4'>
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
      <div class='w-full sm:w-1/2'>
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
