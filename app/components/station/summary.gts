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
          @compact={{true}}
          class="min-w-0 h-full"
        >
          <dl class="m-0 grid gap-2 md:gap-3">
            <StationMetricCard
              @compact={{true}}
              @format="windSpeed"
              @label={{t "wind.speed"}}
              @value={{this.reading.speed}}
              @valueClass={{this.speedValueClass}}
            />

            <StationMetricCard
              @compact={{true}}
              @format="windSpeed"
              @label={{t "wind.gusts"}}
              @value={{this.reading.gusts}}
              @valueClass={{this.gustsValueClass}}
            />

            <StationMetricCard
              @compact={{true}}
              @format="azimuth"
              @label={{t "wind.direction"}}
              @value={{this.reading.direction}}
            />

            <StationMetricCard
              @compact={{true}}
              @format="temperature"
              @label={{t "air.temperature"}}
              @value={{this.reading.temperature}}
            />

            <StationMetricCard
              @compact={{true}}
              @format="humidity"
              @label={{t "air.humidity"}}
              @value={{this.reading.humidity}}
            />

            <StationMetricCard
              @compact={{true}}
              @format="pressure"
              @label={{t "air.pressure"}}
              @value={{this.reading.pressure}}
            />

            <StationMetricCard
              @compact={{true}}
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
