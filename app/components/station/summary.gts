import Component from '@glimmer/component';
import { formatNumber, t } from 'ember-intl';
import azimuthToCardinal from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';
import StationMetricCard from './metric-card';
import type { History, Station } from 'winds-mobi-client-web/services/store.js';
import StationSectionCard from './section-card';
import WindDirection from './wind-direction';

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

    return this.args.history.filter(
      (record) => record.timestamp >= minTimestamp
    );
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

  styleForWindSpeed(speed: number) {
    return `color: ${windToColour(speed)};`;
  }

  get speedStyle() {
    return this.styleForWindSpeed(this.reading.speed);
  }

  get gustsStyle() {
    return this.styleForWindSpeed(this.reading.gusts);
  }

  get lastHourMaximumStyle() {
    return this.styleForWindSpeed(this.lastHourMaximumSpeed);
  }

  get lastHourMeanStyle() {
    return this.styleForWindSpeed(this.lastHourMeanSpeed);
  }

  get lastHourMinimumStyle() {
    return this.styleForWindSpeed(this.lastHourMinimumSpeed);
  }

  <template>
    <section data-test-station-summary-section class="px-4 py-4 sm:px-5">
      <div class="grid gap-3">
        <div class="grid min-w-0 grid-cols-2 gap-3">
          <StationSectionCard @title={{t "station.summary.wind"}}>
            <dl class="space-y-2.5">
              <StationMetricCard @label={{t "wind.speed"}}>
                <span style={{this.speedStyle}}>
                  {{formatNumber
                    this.reading.speed
                    style="unit"
                    unit="kilometer-per-hour"
                  }}
                </span>
              </StationMetricCard>

              <StationMetricCard @label={{t "wind.gusts"}}>
                <span style={{this.gustsStyle}}>
                  {{formatNumber
                    this.reading.gusts
                    style="unit"
                    unit="kilometer-per-hour"
                  }}
                </span>
              </StationMetricCard>

              <StationMetricCard
                @label={{t "wind.direction"}}
                @valueClass="text-sm text-slate-900"
              >
                {{this.directionCardinal}}
                {{t "format.azimuth" azimuth=this.reading.direction}}
              </StationMetricCard>
            </dl>
          </StationSectionCard>

          <StationSectionCard @title={{t "station.summary.air"}}>
            <dl class="space-y-2.5">
              <StationMetricCard @label={{t "air.temperature"}}>
                {{formatNumber
                  this.reading.temperature
                  style="unit"
                  unit="celsius"
                }}
              </StationMetricCard>

              <StationMetricCard
                @label={{t "air.humidity"}}
                @valueClass="text-sm text-slate-900"
              >
                {{t "format.relativeHumidity" value=this.reading.humidity}}
              </StationMetricCard>

              <StationMetricCard
                @label={{t "air.pressure"}}
                @valueClass="text-sm text-slate-900"
              >
                {{t "format.pressure" value=this.reading.pressure}}
              </StationMetricCard>

              <StationMetricCard
                @label={{t "air.rain"}}
                @valueClass="text-sm text-slate-900"
              >
                {{t "format.rain" value=this.reading.rain}}
              </StationMetricCard>
            </dl>
          </StationSectionCard>
        </div>

        <StationSectionCard @title={{t "wind.lastHour"}} class="min-w-0">
          <div
            class="grid grid-cols-[minmax(0,1fr)_9rem] gap-3 items-stretch md:grid-cols-[minmax(0,1fr)_12rem]"
          >
            <div class="min-w-0 h-full">
              <WindDirection @data={{this.recentHistory}} />
            </div>

            <dl class="grid gap-2">
              <StationMetricCard
                @label={{t "wind.maximum"}}
                @valueClass="text-sm"
                @valueStyle={{this.lastHourMaximumStyle}}
              >
                {{formatNumber
                  this.lastHourMaximumSpeed
                  style="unit"
                  unit="kilometer-per-hour"
                }}
              </StationMetricCard>

              <StationMetricCard
                @label={{t "wind.mean"}}
                @valueClass="text-sm"
                @valueStyle={{this.lastHourMeanStyle}}
              >
                {{formatNumber
                  this.lastHourMeanSpeed
                  style="unit"
                  unit="kilometer-per-hour"
                }}
              </StationMetricCard>

              <StationMetricCard
                @label={{t "wind.minimum"}}
                @valueClass="text-sm"
                @valueStyle={{this.lastHourMinimumStyle}}
              >
                {{formatNumber
                  this.lastHourMinimumSpeed
                  style="unit"
                  unit="kilometer-per-hour"
                }}
              </StationMetricCard>
            </dl>
          </div>
        </StationSectionCard>
      </div>
    </section>
  </template>
}
