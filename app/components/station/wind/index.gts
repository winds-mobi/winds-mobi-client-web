import Component from '@glimmer/component';
import type { History } from 'winds-mobi-client-web/services/store.js';
import { t } from 'ember-intl';
import StationWindsGraph from './graph';

export interface StationWindsSignature {
  Args: {
    history: History[];
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationWinds extends Component<StationWindsSignature> {
  <template>
    <section data-test-station-wind-section class="px-4 py-5 sm:px-6">
      <h2 class="text-base font-semibold text-slate-900">
        {{t "station.wind"}}
      </h2>

      <div class="mt-4">
        <StationWindsGraph @data={{@history}} />
      </div>
    </section>
  </template>
}
