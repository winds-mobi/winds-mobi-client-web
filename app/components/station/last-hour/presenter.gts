import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import { t } from 'ember-intl';
import ArrowLineDown from 'ember-phosphor-icons/components/ph-arrow-line-down';
import ArrowLineUp from 'ember-phosphor-icons/components/ph-arrow-line-up';
import ArrowsInLineVertical from 'ember-phosphor-icons/components/ph-arrows-in-line-vertical';
import StationMetricCard from '../metric-card';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type { History } from 'winds-mobi-client-web/services/store.js';
import WindDirectionGraph from '../wind-direction/graph';
import { windToTextClass } from 'winds-mobi-client-web/helpers/wind-to-colour';

export interface StationLastHourContentSignature {
  Args: {
    stationId: string;
    history: History[];
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationLastHourContent extends Component<StationLastHourContentSignature> {
  @service declare settings: SettingsService;

  @cached
  get lastHourSpeeds() {
    return this.args.history.map((record) => record.speed);
  }

  get hasHistory() {
    return this.args.history.length > 0;
  }

  get lastHourMinimumSpeed() {
    return this.hasHistory ? Math.min(...this.lastHourSpeeds) : undefined;
  }

  get lastHourMeanSpeed() {
    if (!this.hasHistory) {
      return undefined;
    }

    const total = this.lastHourSpeeds.reduce((sum, speed) => sum + speed, 0);

    return total / this.lastHourSpeeds.length;
  }

  get lastHourMaximumSpeed() {
    return this.hasHistory ? Math.max(...this.lastHourSpeeds) : undefined;
  }

  get lastHourMaximumValueClass() {
    return this.windClassFor(this.lastHourMaximumSpeed);
  }

  get lastHourMeanValueClass() {
    return this.windClassFor(this.lastHourMeanSpeed);
  }

  get lastHourMinimumValueClass() {
    return this.windClassFor(this.lastHourMinimumSpeed);
  }

  private windClassFor(speed: number | undefined) {
    return speed === undefined ? undefined : windToTextClass(speed);
  }

  <template>
    <div class="grid gap-2 md:gap-3">
      <div class="min-w-0 w-full aspect-square">
        <WindDirectionGraph @stationId={{@stationId}} @data={{@history}} />
      </div>

      <dl class="m-0 grid gap-1 md:gap-2">
        <StationMetricCard
          @format="windSpeed"
          @label={{t "wind.maximum"}}
          @value={{this.lastHourMaximumSpeed}}
          @valueClass={{this.lastHourMaximumValueClass}}
          @icon={{if this.settings.useIconLabels ArrowLineUp}}
        />

        <StationMetricCard
          @format="windSpeed"
          @label={{t "wind.mean"}}
          @value={{this.lastHourMeanSpeed}}
          @valueClass={{this.lastHourMeanValueClass}}
          @icon={{if this.settings.useIconLabels ArrowsInLineVertical}}
        />

        <StationMetricCard
          @format="windSpeed"
          @label={{t "wind.minimum"}}
          @value={{this.lastHourMinimumSpeed}}
          @valueClass={{this.lastHourMinimumValueClass}}
          @icon={{if this.settings.useIconLabels ArrowLineDown}}
        />
      </dl>
    </div>
  </template>
}
