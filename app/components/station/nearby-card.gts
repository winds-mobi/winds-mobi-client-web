import type { TOC } from '@ember/component/template-only';
import StationHeader from './header';
import StationSummary from './summary';
import type { Station } from 'winds-mobi-client-web/services/store.js';

export interface StationNearbyCardSignature {
  Args: {
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

const StationNearbyCard: TOC<StationNearbyCardSignature> = <template>
  <article
    data-test-nearby-station-card
    class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-900/12 sm:p-5"
  >
    <div class="mb-4">
      <StationHeader @station={{@station}} />
    </div>

    <StationSummary @station={{@station}} />
  </article>
</template>;

export default StationNearbyCard;
