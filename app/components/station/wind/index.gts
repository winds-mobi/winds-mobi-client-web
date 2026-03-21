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

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class StationWinds extends Component<StationWindsSignature> {
  <template>
    <section data-test-station-wind-section class="px-4 py-4 sm:px-5">
      <h2 class="text-sm font-semibold text-slate-950">
        {{t "station.wind"}}
      </h2>

      <div
        class="mt-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5"
      >
        <StationWindsGraph @data={{@history}} />
      </div>
    </section>
  </template>
}
