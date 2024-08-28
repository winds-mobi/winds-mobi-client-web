import Component from '@glimmer/component';
import Heart from 'ember-phosphor-icons/components/ph-heart';
import Wind from 'ember-phosphor-icons/components/ph-wind';
import Speedometer from 'ember-phosphor-icons/components/ph-speedometer';
import type { Station } from 'winds-mobi-client-web/services/store';
import { formatNumber } from 'ember-intl';

export interface DetailsIndexSignature {
  Args: { station: Station };
  Blocks: {
    default: [];
  };
  Element: null;
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class DetailsIndex extends Component<DetailsIndexSignature> {
  <template>
    <div class='flex flex-col'>
      <div>
        <Heart class='inline' />
        {{@station.name}}
      </div>
      <div>
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
    </div>
  </template>
}
