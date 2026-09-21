import type { TOC } from '@ember/component/template-only';
import { LinkTo } from '@ember/routing';
import { t } from 'ember-intl';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { focusQueryParamsFor } from 'winds-mobi-client-web/utils/map-view';

export interface StationHeaderSignature {
  Args: {
    // Optional so callers can render this unconditionally while a station
    // is still loading (see station/index.gts) -- rendering nothing then
    // is this component's own call, not something the caller should have
    // to guard against first.
    station?: Station;
  };
  Element: null;
}

// Just the station's clickable title link. Callers that also want the
// favourite toggle beside it render <StationFavoriteButton> themselves
// (see station/nearby-card.gts) — this component has no opinion on
// favourites at all.
const StationHeader: TOC<StationHeaderSignature> = <template>
  {{#if @station}}
    <LinkTo
      data-test-station-title
      @route="map.station"
      @model={{@station.id}}
      @query={{focusQueryParamsFor @station}}
      title={{t "station.showOnMap"}}
    >
      {{@station.name}}
    </LinkTo>
  {{/if}}
</template>;

export default StationHeader;
