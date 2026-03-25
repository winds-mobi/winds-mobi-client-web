import Component from '@glimmer/component';
import { t } from 'ember-intl';
import { windToTextClass } from 'winds-mobi-client-web/helpers/wind-to-colour';
import StationLastHour from './last-hour';
import StationMetricCard from './metric-card';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import StationSectionCard from './section-card';

export interface StationSummarySignature {
  Args: {
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationSummary extends Component<StationSummarySignature> {
  get reading() {
    return this.args.station.last;
  }

  get speedValueClass() {
    return windToTextClass(this.reading.speed);
  }

  get gustsValueClass() {
    return windToTextClass(this.reading.gusts);
  }

  <template>
    <section data-test-station-summary-section>
      <div class="grid grid-cols-2 items-stretch gap-1.5 md:gap-3">
        <StationSectionCard
          @title={{t "station.summary.now"}}
        >
          <dl class="m-0 grid gap-2 md:gap-3">
            <StationMetricCard
              @format="windSpeed"
              @label={{t "wind.speed"}}
              @value={{this.reading.speed}}
              @valueClass={{this.speedValueClass}}
            />

            <StationMetricCard
              @format="windSpeed"
              @label={{t "wind.gusts"}}
              @value={{this.reading.gusts}}
              @valueClass={{this.gustsValueClass}}
            />

            <StationMetricCard
              @format="azimuth"
              @label={{t "wind.direction"}}
              @value={{this.reading.direction}}
            />

            <StationMetricCard
              @format="temperature"
              @label={{t "air.temperature"}}
              @value={{this.reading.temperature}}
            />

            <StationMetricCard
              @format="humidity"
              @label={{t "air.humidity"}}
              @value={{this.reading.humidity}}
            />

            <StationMetricCard
              @format="pressure"
              @label={{t "air.pressure"}}
              @value={{this.reading.pressure}}
            />

            <StationMetricCard
              @format="rainfall"
              @label={{t "air.rain"}}
              @value={{this.reading.rain}}
            />
          </dl>
        </StationSectionCard>

        <StationLastHour @stationId={{@station.id}} />
      </div>
    </section>
  </template>
}
