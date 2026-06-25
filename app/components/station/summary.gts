import Component from '@glimmer/component';
import { service } from '@ember/service';
import { t } from 'ember-intl';
import CloudRain from 'ember-phosphor-icons/components/ph-cloud-rain';
import Compass from 'ember-phosphor-icons/components/ph-compass';
import ArrowLineUp from 'ember-phosphor-icons/components/ph-arrow-line-up';
import Drop from 'ember-phosphor-icons/components/ph-drop';
import Gauge from 'ember-phosphor-icons/components/ph-gauge';
import Thermometer from 'ember-phosphor-icons/components/ph-thermometer';
import Wind from 'ember-phosphor-icons/components/ph-wind';
import { temperatureToTextClass } from 'winds-mobi-client-web/helpers/temperature-to-colour';
import { windToTextClass } from 'winds-mobi-client-web/helpers/wind-to-colour';
import StationLastHour from './last-hour';
import StationMetricCard from './metric-card';
import type SettingsService from 'winds-mobi-client-web/services/settings';
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
  @service declare settings: SettingsService;

  <template>
    <section data-test-station-summary-section>
      <div class="grid grid-cols-2 items-stretch gap-1.5 md:gap-3">
        <StationSectionCard @title={{t "station.summary.now"}}>
          <dl class="m-0 grid gap-1 md:gap-2">
            <StationMetricCard
              @format="windSpeed"
              @label={{t "wind.speed"}}
              @value={{@station.last.speed}}
              @valueClass={{windToTextClass @station.last.speed}}
              @icon={{if this.settings.useIconLabels Wind}}
            />

            <StationMetricCard
              @format="windSpeed"
              @label={{t "wind.gusts"}}
              @value={{@station.last.gusts}}
              @valueClass={{windToTextClass @station.last.gusts}}
              @icon={{if this.settings.useIconLabels ArrowLineUp}}
            />

            <StationMetricCard
              @format="azimuth"
              @label={{t "wind.direction"}}
              @value={{@station.last.direction}}
              @icon={{if this.settings.useIconLabels Compass}}
            />

            <StationMetricCard
              @format="temperature"
              @label={{t "air.temperature"}}
              @value={{@station.last.temperature}}
              @valueClass={{temperatureToTextClass @station.last.temperature}}
              @icon={{if this.settings.useIconLabels Thermometer}}
            />

            <StationMetricCard
              @format="humidity"
              @label={{t "air.humidity"}}
              @value={{@station.last.humidity}}
              @icon={{if this.settings.useIconLabels Drop}}
            />

            <StationMetricCard
              @format="pressure"
              @label={{t "air.pressure"}}
              @value={{@station.last.pressure}}
              @icon={{if this.settings.useIconLabels Gauge}}
            />

            <StationMetricCard
              @format="rainfall"
              @label={{t "air.rain"}}
              @value={{@station.last.rain}}
              @icon={{if this.settings.useIconLabels CloudRain}}
            />
          </dl>
        </StationSectionCard>

        <StationLastHour @stationId={{@station.id}} />
      </div>
    </section>
  </template>
}
