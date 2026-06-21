import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import { t } from 'ember-intl';
import type { IntlService } from 'ember-intl';
import ArrowLineDown from 'ember-phosphor-icons/components/ph-arrow-line-down';
import ArrowLineUp from 'ember-phosphor-icons/components/ph-arrow-line-up';
import ArrowsInLineVertical from 'ember-phosphor-icons/components/ph-arrows-in-line-vertical';
import type { History } from 'winds-mobi-client-web/services/store.js';
import WindDirection from '../wind-direction';
import { windToTextClass } from 'winds-mobi-client-web/helpers/wind-to-colour';

export interface StationLastHourContentSignature {
  Args: {
    history: History[];
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationLastHourContent extends Component<StationLastHourContentSignature> {
  @service declare intl: IntlService;

  @cached
  get lastHourHistory() {
    return this.args.history;
  }

  @cached
  get lastHourSpeeds() {
    return this.lastHourHistory.map((record) => record.speed);
  }

  get hasHistory() {
    return this.lastHourHistory.length > 0;
  }

  get lastHourMinimumSpeed() {
    return this.hasHistory ? Math.min(...this.lastHourSpeeds) : undefined;
  }

  get lastHourMeanSpeed() {
    if (!this.hasHistory) {
      return undefined;
    }

    const sortedSpeeds = [...this.lastHourSpeeds].sort((left, right) => {
      return left - right;
    });

    return sortedSpeeds[Math.floor(sortedSpeeds.length / 2)];
  }

  get lastHourMaximumSpeed() {
    return this.hasHistory ? Math.max(...this.lastHourSpeeds) : undefined;
  }

  get lastHourMaximumValueClass() {
    return this.hasHistory
      ? windToTextClass(this.lastHourMaximumSpeed)
      : undefined;
  }

  get lastHourMeanValueClass() {
    return this.hasHistory
      ? windToTextClass(this.lastHourMeanSpeed)
      : undefined;
  }

  get lastHourMinimumValueClass() {
    return this.hasHistory
      ? windToTextClass(this.lastHourMinimumSpeed)
      : undefined;
  }

  get lastHourMinimumLabel() {
    return this.hasHistory
      ? this.intl.formatNumber(this.lastHourMinimumSpeed, {
          format: 'integer',
        })
      : undefined;
  }

  get lastHourMeanLabel() {
    return this.hasHistory
      ? this.intl.formatNumber(this.lastHourMeanSpeed, { format: 'integer' })
      : undefined;
  }

  get lastHourMaximumLabel() {
    return this.hasHistory
      ? this.intl.formatNumber(this.lastHourMaximumSpeed, {
          format: 'integer',
        })
      : undefined;
  }

  <template>
    <div class="grid gap-2 md:gap-3">
      <div class="min-w-0 w-full aspect-square">
        <WindDirection @data={{this.lastHourHistory}} />
      </div>

      {{#if this.hasHistory}}
        <dl
          class="m-0 flex items-baseline justify-between text-base font-semibold md:text-lg"
        >
          <dt class="sr-only">{{t "wind.minimum"}}</dt>
          <dd
            class="m-0 flex items-baseline gap-0.5"
            title={{t "wind.minimum"}}
          >
            <ArrowLineDown class="text-black" />
            <span
              class={{this.lastHourMinimumValueClass}}
            >{{this.lastHourMinimumLabel}}</span>
            <span class="text-[0.5em] font-normal text-slate-500">km/h</span>
          </dd>

          <dt class="sr-only">{{t "wind.mean"}}</dt>
          <dd class="m-0 flex items-baseline gap-0.5" title={{t "wind.mean"}}>
            <ArrowsInLineVertical class="text-black" />
            <span
              class={{this.lastHourMeanValueClass}}
            >{{this.lastHourMeanLabel}}</span>
            <span class="text-[0.5em] font-normal text-slate-500">km/h</span>
          </dd>

          <dt class="sr-only">{{t "wind.maximum"}}</dt>
          <dd
            class="m-0 flex items-baseline gap-0.5"
            title={{t "wind.maximum"}}
          >
            <ArrowLineUp class="text-black" />
            <span
              class={{this.lastHourMaximumValueClass}}
            >{{this.lastHourMaximumLabel}}</span>
            <span class="text-[0.5em] font-normal text-slate-500">km/h</span>
          </dd>
        </dl>
      {{/if}}
    </div>
  </template>
}
