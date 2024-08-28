import Component from '@glimmer/component';
import { get } from '@ember/helper';
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
    {{log @station}}
    <div class='flex flex-col'>
      <div>
        <Heart class='inline' />
        {{@station.short}}
      </div>
      <div>
        {{formatNumber @station.alt style='unit' unit='meter'}}
      </div>
      <div>
        <Wind class='inline' />
        {{formatNumber
          (get @station.last 'w-avg')
          style='unit'
          unit='kilometer-per-hour'
        }}
      </div>
      <div>
        <Speedometer class='inline' />
        {{formatNumber
          (get @station.last 'w-max')
          style='unit'
          unit='kilometer-per-hour'
        }}
      </div>
      <div>
        {{get @station 'pv-name'}}
      </div>
    </div>
  </template>
}
