import type { TOC } from '@ember/component/template-only';
import { t } from 'ember-intl';
import StationHistorySection from '../history-section';
import StationLastHourContent from './presenter';

export interface StationLastHourSignature {
  Args: {
    stationId: string;
  };
  Element: null;
}

const DURATION = 1 * 60 * 60;
const KEYS = ['w-dir', 'w-avg', 'w-max'];

const StationLastHour: TOC<StationLastHourSignature> = <template>
  <StationHistorySection
    @stationId={{@stationId}}
    @title={{t "wind.lastHour"}}
    @duration={{DURATION}}
    @keys={{KEYS}}
    as |history|
  >
    <StationLastHourContent @history={{history}} />
  </StationHistorySection>
</template>;

export default StationLastHour;
