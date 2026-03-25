import Component from '@glimmer/component';
import type { History } from 'winds-mobi-client-web/services/store.js';
import { t } from 'ember-intl';
import StationSectionCard from '../section-card';
import StationWindsGraph from './graph';

export interface StationWindsSignature {
  Args: {
    history: History[];
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class StationWinds extends Component<StationWindsSignature> {
  <template>
    <section data-test-station-wind-section>
      <StationSectionCard @title={{t "station.wind"}}>
        <StationWindsGraph @data={{@history}} />
      </StationSectionCard>
    </section>
  </template>
}
