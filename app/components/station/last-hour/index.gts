import type { TOC } from '@ember/component/template-only';
import { t } from 'ember-intl';
import StationHistorySection from '../history-section';
import { LAST_HOUR_DURATION, LAST_HOUR_KEYS } from '../history-request';
import StationLastHourContent from './presenter';

export interface StationLastHourSignature {
  Args: {
    stationId: string;
  };
  Element: null;
}

const StationLastHour: TOC<StationLastHourSignature> = <template>
  <StationHistorySection
    @stationId={{@stationId}}
    @title={{t "wind.lastHour"}}
    @duration={{LAST_HOUR_DURATION}}
    @keys={{LAST_HOUR_KEYS}}
    as |history|
  >
    <StationLastHourContent @history={{history}} />
  </StationHistorySection>
</template>;

export default StationLastHour;
