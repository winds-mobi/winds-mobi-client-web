import type { TOC } from '@ember/component/template-only';
import StationFavoriteButton from './favorite-button';
import StationHideButton from './hide-button';
import StationHeader from './header';
import StationMeta from './meta';
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
      <div class="flex min-w-0 items-start justify-between gap-2">
        <h2 class="min-w-0 font-bold text-slate-950">
          <StationHeader @station={{@station}} />
        </h2>
        <div class="flex shrink-0 items-center">
          <StationHideButton @station={{@station}} />
          <StationFavoriteButton @station={{@station}} />
        </div>
      </div>
      <StationMeta @station={{@station}} class="mt-1.5" />
    </div>

    <StationSummary @station={{@station}} />
  </article>
</template>;

export default StationNearbyCard;
