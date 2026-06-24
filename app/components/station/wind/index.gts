import Component from '@glimmer/component';
import { t } from 'ember-intl';
import StationHistorySection from '../history-section';
import StationWindContent from './presenter';

export interface StationWindSignature {
  Args: {
    stationId: string;
  };
  Element: null;
}

const DURATION = 435600;
const KEYS = ['w-dir', 'w-avg', 'w-max'];

export default class StationWind extends Component<StationWindSignature> {
  <template>
    <section data-test-station-wind-section>
      <StationHistorySection
        @stationId={{@stationId}}
        @title={{t "station.wind"}}
        @duration={{DURATION}}
        @keys={{KEYS}}
        as |history|
      >
        <StationWindContent @history={{history}} />
      </StationHistorySection>
    </section>
  </template>
}
