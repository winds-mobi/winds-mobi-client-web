import Component from '@glimmer/component';
import { t } from 'ember-intl';
import StationHistorySection from '../history-section';
import StationAirContent from './presenter';

export interface StationAirSignature {
  Args: {
    stationId: string;
  };
  Element: null;
}

const DURATION = 435600;
const KEYS = ['temp', 'hum', 'rain'];

export default class StationAir extends Component<StationAirSignature> {
  <template>
    <section data-test-station-air-section>
      <StationHistorySection
        @stationId={{@stationId}}
        @title={{t "station.air"}}
        @duration={{DURATION}}
        @keys={{KEYS}}
        as |history|
      >
        <StationAirContent @history={{history}} />
      </StationHistorySection>
    </section>
  </template>
}
