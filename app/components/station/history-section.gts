import type { TOC } from '@ember/component/template-only';
import type { History } from 'winds-mobi-client-web/services/store';
import StationHistoryRequest from './history-request';
import StationSectionCard from './section-card';

export interface StationHistorySectionSignature {
  Args: {
    stationId: string;
    title: string;
    duration: number;
    keys: string[];
  };
  Blocks: {
    // Rendered for the resolved history and, with an empty list, while loading
    // or on error — so the presenter draws an empty chart instead of flashing.
    default: [history: History[]];
  };
  Element: null;
}

// The shared fetcher half of a station history section: a section card around
// the station's `history` over `@duration` with the given sparse-fieldset
// `@keys` (see StationHistoryRequest), yielding the readings to a presenter
// block. The three sections (wind, air, last-hour) differ only in title,
// duration, keys, and presenter — see CLAUDE.md for the per-section keys.
const StationHistorySection: TOC<StationHistorySectionSignature> = <template>
  <StationSectionCard @title={{@title}}>
    <StationHistoryRequest
      @stationId={{@stationId}}
      @duration={{@duration}}
      @keys={{@keys}}
      as |history|
    >
      {{yield history}}
    </StationHistoryRequest>
  </StationSectionCard>
</template>;

export default StationHistorySection;
