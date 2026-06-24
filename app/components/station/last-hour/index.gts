import Component from '@glimmer/component';
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

export default class StationLastHour extends Component<StationLastHourSignature> {
  <template>
    <StationHistorySection
      @stationId={{@stationId}}
      @title={{t "wind.lastHour"}}
      @duration={{DURATION}}
      @keys={{KEYS}}
      as |history|
    >
      <StationLastHourContent @history={{history}} />
    </StationHistorySection>
  </template>
}
