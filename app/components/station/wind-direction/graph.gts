import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { array } from '@ember/helper';
import type { History } from 'winds-mobi-client-web/services/store.js';
import { service } from '@ember/service';
import { type IntlService } from 'ember-intl';
import Polar from 'winds-mobi-client-web/components/chart/polar';
import { windDirectionMarkerColours } from 'winds-mobi-client-web/utils/wind-direction-marker';

export interface WindDirectionGraphSignature {
  Args: {
    data: History[];
    // Only used to key the chart below -- see the {{#each}} in the template.
    stationId: string;
    hideAxisLabels?: boolean;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

const LAST_HOUR = 1 * 60 * 60 * 1000;
const QUARTER_HOUR = 15 * 60 * 1000;

function quarterHourTicks(minTimestamp: number, maxTimestamp: number) {
  const firstTick = Math.ceil(minTimestamp / QUARTER_HOUR) * QUARTER_HOUR;
  const ticks: number[] = [];

  for (let tick = firstTick; tick <= maxTimestamp; tick += QUARTER_HOUR) {
    ticks.push(tick);
  }

  return ticks;
}

export default class WindDirectionGraph extends Component<WindDirectionGraphSignature> {
  @service declare intl: IntlService;

  // `@cached` keeps `chartOptions`/`points`/`chartData` returning the *same*
  // object/array references across the repeated autotracked reads Glimmer's
  // render pipeline performs in a single render pass. Without it, each read
  // built a fresh object, which made `ember-highcharts` see "changed" args on
  // every access and re-init/update the underlying chart mid-render -- the
  // root cause of this component's flaky marker-rendering (see TODO.md).
  // `chartOptions` reads `this.args.data` purely to opt back into
  // recomputing when a refresh brings new history in, matching this
  // codebase's `mapRefresh.lastRefresh`-read convention for the same purpose.
  @cached
  get chartOptions() {
    void this.args.data;
    const now = Date.now();
    const minTimestamp = now - LAST_HOUR;

    return {
      chart: {
        height: '100%',
        // Keep a tiny inset so the outer polar line does not clip against the card edge.
        spacing: [1, 1, 1, 1],
        type: 'scatter',
      },
      pane: {
        size: '99%',
      },
      // Omit `xAxis` entirely rather than setting it to `undefined` — Polar's
      // shallow merge spreads override keys over defaults, so an explicit
      // `undefined` would clobber the default xAxis instead of falling back to it.
      ...(this.args.hideAxisLabels
        ? { xAxis: { labels: { enabled: false } } }
        : {}),
      yAxis: {
        min: minTimestamp,
        max: now,
        tickPositions: quarterHourTicks(minTimestamp, now),
      },
    };
  }

  @cached
  get points() {
    const data = this.args.data ?? [];

    if (data.length === 0) {
      return [];
    }

    return data.map((elm) => {
      const { lineColor, fillColor } = windDirectionMarkerColours(
        elm.speed,
        elm.gusts
      );

      return {
        // Without an explicit id, Highcharts' incremental `series.setData()`
        // update falls back to matching incoming points against existing
        // ones by raw x value (see Series.prototype.findPointIndex) -- here
        // that's wind direction, a coarse 0-360 value that collides easily
        // both within one station's own history and across two different
        // stations. Confirmed empirically (issue #111): revisiting a
        // recently-cached station reuses the same chart instance (Warp
        // Drive serves it without a loading gap, so <Request>'s content
        // block never gets torn down), and Highcharts' x-fallback matching
        // then displaces one coincidentally-matching point to the wrong
        // position in the array -- values stay correct, but the polar
        // line's draw order doesn't, which reads as the "tangled path"
        // glitch. The id alone doesn't fully fix this (a never-seen id
        // still falls through to the x-value fallback), which is why the
        // {{#each}} keying below is also needed -- but it keeps the
        // same-station incremental-update path (a real refresh poll)
        // correctly matching by identity instead of by coincidence.
        id: elm.id,
        x: elm.direction,
        y: elm.timestamp,
        color: lineColor,
        marker: {
          enabled: true,
          lineColor,
          fillColor,
        },
        customTooltip: `${this.intl.formatTime(elm.timestamp, {
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
        })} ${this.intl.formatNumber(elm.speed, {
          format: 'windSpeed',
        })}`,
      };
    });
  }

  @cached
  get chartData() {
    return [
      {
        connectEnds: false,
        name: 'Wind Direction',
        data: this.points,
        lineWidth: 1.5,
        marker: {
          radius: 3,
          lineWidth: 1.5,
        },
      },
    ];
  }

  <template>
    {{! Keying this each on @stationId forces Highcharts' chart instance to
      be destroyed and recreated whenever the station changes, so there's
      never a stale chart to incorrectly update in the first place (issue
      #111) -- this is the case a same-station refresh doesn't hit, since
      @stationId doesn't change then, so the normal incremental update (and
      its point-level id matching, see `points` above) still applies there. }}
    {{#each (array @stationId)}}
      <Polar
        class="h-full min-h-0 min-w-0 w-full [&_.chart-container]:h-full [&_.chart-container]:min-h-0 [&_.chart-container]:w-full"
        @chartData={{this.chartData}}
        @chartOptions={{this.chartOptions}}
      />
    {{/each}}
  </template>
}
