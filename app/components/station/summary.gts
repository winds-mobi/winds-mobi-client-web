import Component from '@glimmer/component';
import { formatNumber, t } from 'ember-intl';
import azimuthToCardinal from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import type { History, Station } from 'winds-mobi-client-web/services/store.js';
import WindDirection from './wind-direction';
import RelativeTime from '../relative-time';

export interface StationSummarySignature {
  Args: {
    history: History[];
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

const DURATION = 1 * 60 * 60;

export default class StationSummary extends Component<StationSummarySignature> {
  get reading() {
    return this.args.station.last;
  }

  get directionCardinal() {
    return azimuthToCardinal(this.reading.direction);
  }

  get recentHistory() {
    const latestTimestamp = Math.max(
      ...this.args.history.map((record) => record.timestamp)
    );

    if (!Number.isFinite(latestTimestamp)) {
      return [];
    }

    const minTimestamp = latestTimestamp - DURATION * 1000;

    return this.args.history.filter((record) => record.timestamp >= minTimestamp);
  }

  get lastHourSpeeds() {
    const speeds = this.recentHistory.map((record) => record.speed);

    return speeds.length > 0 ? speeds : [this.reading.speed];
  }

  get lastHourMinimumSpeed() {
    return Math.min(...this.lastHourSpeeds);
  }

  get lastHourMeanSpeed() {
    return (
      this.lastHourSpeeds.reduce((sum, speed) => sum + speed, 0) /
      this.lastHourSpeeds.length
    );
  }

  get lastHourMaximumSpeed() {
    return Math.max(...this.lastHourSpeeds);
  }

  <template>
    <section data-test-station-summary-section class="px-4 py-4 sm:px-5">
      <div class="flex items-center justify-between gap-4">
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
        >
          {{t "station.summary.title"}}
        </p>

        <div
          class="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
        >
          <RelativeTime @timestamp={{this.reading.timestamp}} />
        </div>
      </div>

      <div class="mt-3 grid gap-3">
        <div class="grid min-w-0 gap-3 sm:grid-cols-2">
          <section
            class="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5"
          >
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
            >
              {{t "station.summary.wind"}}
            </p>

            <dl class="mt-3 space-y-2.5">
              <div class="grid grid-cols-2 gap-2">
                <div
                  class="rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200/80"
                >
                  <dt class="text-[11px] font-medium text-slate-500">
                    {{t "wind.speed"}}
                  </dt>
                  <dd
                    class="mt-1.5 text-lg font-semibold tracking-tight text-slate-950"
                  >
                    {{formatNumber
                      this.reading.speed
                      style="unit"
                      unit="kilometer-per-hour"
                    }}
                  </dd>
                </div>

                <div
                  class="rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200/80"
                >
                  <dt class="text-[11px] font-medium text-slate-500">
                    {{t "wind.gusts"}}
                  </dt>
                  <dd
                    class="mt-1.5 text-lg font-semibold tracking-tight text-slate-950"
                  >
                    {{formatNumber
                      this.reading.gusts
                      style="unit"
                      unit="kilometer-per-hour"
                    }}
                  </dd>
                </div>
              </div>

              <div
                class="space-y-2.5 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200/80"
              >
                <div class="flex items-baseline justify-between gap-4">
                  <dt class="text-sm text-slate-500">
                    {{t "wind.direction"}}
                  </dt>
                  <dd class="text-right text-sm font-medium text-slate-900">
                    {{this.directionCardinal}}
                    <span class="text-slate-500">
                      {{t "format.azimuth" azimuth=this.reading.direction}}
                    </span>
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          <section
            class="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5"
          >
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
            >
              {{t "station.summary.air"}}
            </p>

            <dl class="mt-3 space-y-2.5">
              <div
                class="rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200/80"
              >
                <dt class="text-[11px] font-medium text-slate-500">
                  {{t "air.temperature"}}
                </dt>
                <dd
                  class="mt-1.5 text-lg font-semibold tracking-tight text-slate-950"
                >
                  {{formatNumber
                    this.reading.temperature
                    style="unit"
                    unit="celsius"
                  }}
                </dd>
              </div>

              <div
                class="space-y-2.5 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200/80"
              >
                <div class="flex items-baseline justify-between gap-4">
                  <dt class="text-sm text-slate-500">
                    {{t "air.humidity"}}
                  </dt>
                  <dd class="text-right text-sm font-medium text-slate-900">
                    {{t "format.relativeHumidity" value=this.reading.humidity}}
                  </dd>
                </div>

                <div class="flex items-baseline justify-between gap-4">
                  <dt class="text-sm text-slate-500">
                    {{t "air.pressure"}}
                  </dt>
                  <dd class="text-right text-sm font-medium text-slate-900">
                    {{t "format.pressure" value=this.reading.pressure}}
                  </dd>
                </div>

                <div class="flex items-baseline justify-between gap-4">
                  <dt class="text-sm text-slate-500">
                    {{t "air.rain"}}
                  </dt>
                  <dd class="text-right text-sm font-medium text-slate-900">
                    {{t "format.rain" value=this.reading.rain}}
                  </dd>
                </div>
              </div>
            </dl>
          </section>
        </div>

        <div class="min-w-0 rounded-2xl border border-slate-200 bg-white/90 p-3">
          <p
            class="px-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
          >
            {{t "wind.lastHour"}}
          </p>

          <div class="mt-2">
            <WindDirection @data={{this.recentHistory}} />
          </div>

          <dl class="mt-3 grid gap-2 sm:grid-cols-3">
            <div class="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/80">
              <dt class="text-[11px] font-medium text-slate-500">
                {{t "wind.minimum"}}
              </dt>
              <dd class="mt-1.5 text-sm font-semibold text-slate-950">
                {{formatNumber
                  this.lastHourMinimumSpeed
                  style="unit"
                  unit="kilometer-per-hour"
                }}
              </dd>
            </div>

            <div class="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/80">
              <dt class="text-[11px] font-medium text-slate-500">
                {{t "wind.mean"}}
              </dt>
              <dd class="mt-1.5 text-sm font-semibold text-slate-950">
                {{formatNumber
                  this.lastHourMeanSpeed
                  style="unit"
                  unit="kilometer-per-hour"
                }}
              </dd>
            </div>

            <div class="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/80">
              <dt class="text-[11px] font-medium text-slate-500">
                {{t "wind.maximum"}}
              </dt>
              <dd class="mt-1.5 text-sm font-semibold text-slate-950">
                {{formatNumber
                  this.lastHourMaximumSpeed
                  style="unit"
                  unit="kilometer-per-hour"
                }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  </template>
}
