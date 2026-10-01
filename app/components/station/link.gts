import type { TOC } from '@ember/component/template-only';
import { LinkTo } from '@ember/routing';
import { t } from 'ember-intl';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { focusQueryParamsFor } from 'winds-mobi-client-web/utils/map-view';

export interface StationLinkSignature {
  Args: {
    station: Station;
  };
  Element: HTMLAnchorElement;
}

// A station's name, linking to it on the map at the shared focus zoom (see
// `focusQueryParamsFor`). Callers style it through `class`.
const StationLink: TOC<StationLinkSignature> = <template>
  <LinkTo
    data-test-station-title
    @route="map.station"
    @model={{@station.id}}
    @query={{focusQueryParamsFor @station}}
    title={{t "station.showOnMap"}}
    ...attributes
  >
    {{@station.name}}
  </LinkTo>
</template>;

export default StationLink;
