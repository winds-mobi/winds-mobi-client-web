import Component from '@glimmer/component';
import Wind from 'ember-phosphor-icons/components/ph-wind';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import Speedometer from 'ember-phosphor-icons/components/ph-speedometer';
import { formatNumber } from 'ember-intl';
import type { Station } from 'winds-mobi-client-web/services/store';
import Polar from '../chart/polar';
import windToColour from '../../helpers/wind-to-colour';

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
    <div class='flex flex-row flex-wrap'>
      <div class='font-bold text-lg col-span-2 w-full'>
        {{! <Heart class='inline' /> }}
        {{@station.name}}
      </div>

      <div class='flex flex-col px-4 py-5 sm:p-6 w-1/2'>
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
          <a href={{@station.providerUrl.en}}>
            {{@station.providerName}}
          </a>
        </div>
        <div>
          {{formatNumber @station.last.temperature style='unit' unit='celsius'}}
        </div>
      </div>
      <div class='w-1/2'>
        {{log this.demo}}
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
