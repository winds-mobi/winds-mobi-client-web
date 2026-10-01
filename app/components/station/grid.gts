import type { TOC } from '@ember/component/template-only';
import { eq } from '@ember/helper';
import StationCompactCard from './compact-card';
import StationNearbyCard from './nearby-card';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import type {
  StationCardViewMode,
  StationListSurface,
} from 'winds-mobi-client-web/services/station-view';

export interface StationGridSignature {
  Args: {
    stations: Station[];
    view: StationCardViewMode;
    // Names this list's own test hook, so each surface stays addressable
    // while sharing one grid.
    surface: StationListSurface;
  };
  Element: null;
}

// Renders a list of stations as cards — the card-shaped half of a view mode
// (the map is its own renderer). Pure presentation: it owns no request and no
// mode of its own, so switching between its two layouts never refetches.
const StationGrid: TOC<StationGridSignature> = <template>
  {{#if (eq @view "compact")}}
    <div
      class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(14rem,calc(50%-0.375rem)),1fr))]"
      data-test-station-grid-compact={{@surface}}
    >
      {{#each @stations as |station|}}
        <StationCompactCard @station={{station}} />
      {{/each}}
    </div>
  {{else}}
    <div
      class="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(22rem,1fr))]"
      data-test-station-grid={{@surface}}
    >
      {{#each @stations as |station|}}
        <StationNearbyCard @station={{station}} />
      {{/each}}
    </div>
  {{/if}}
</template>;

export default StationGrid;
