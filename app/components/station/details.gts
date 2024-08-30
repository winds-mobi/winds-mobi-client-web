import Component from '@glimmer/component';
import Wind from 'ember-phosphor-icons/components/ph-wind';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import Speedometer from 'ember-phosphor-icons/components/ph-speedometer';
import { formatNumber } from 'ember-intl';
import type { Station } from 'winds-mobi-client-web/services/store';

export interface StationDetailsSignature {
  Args: {
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class StationDetails extends Component<StationDetailsSignature> {
  <template>
    <div class='flex flex-col'>
      <div class='font-bold text-lg'>
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
        <a href={{@station.providerUrl.en}}>
          {{@station.providerName}}
        </a>
      </div>
      <div>
        {{formatNumber @station.last.temperature style='unit' unit='celsius'}}
      </div>

    </div>
  </template>
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    StationDetails: typeof StationDetails;
  }
}
