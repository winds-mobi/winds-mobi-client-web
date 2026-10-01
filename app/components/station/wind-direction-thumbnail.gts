import type { TOC } from '@ember/component/template-only';
import StationHistoryRequest, {
  LAST_HOUR_DURATION,
  LAST_HOUR_KEYS,
} from './history-request';
import WindDirectionGraph from './wind-direction/graph';

export interface StationWindDirectionThumbnailSignature {
  Args: {
    stationId: string;
  };
  Element: HTMLDivElement;
}

// A shrunk version of `station/last-hour`'s polar graph, for rows where there
// is no room for a full section card with min/mean/max stats (e.g. the
// compact card view, #64). Asks for the same last-hour history as
// `StationLastHour` (see LAST_HOUR_DURATION/LAST_HOUR_KEYS), so the two share
// one cached request.
const StationWindDirectionThumbnail: TOC<StationWindDirectionThumbnailSignature> =
  <template>
    <div class="min-h-0 min-w-0" ...attributes>
      <StationHistoryRequest
        @stationId={{@stationId}}
        @duration={{LAST_HOUR_DURATION}}
        @keys={{LAST_HOUR_KEYS}}
        as |history|
      >
        <WindDirectionGraph @data={{history}} @compact={{true}} />
      </StationHistoryRequest>
    </div>
  </template>;

export default StationWindDirectionThumbnail;
