import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import type { History } from 'winds-mobi-client-web/services/store.js';
import { service } from '@ember/service';
import { type IntlService } from 'ember-intl';
import Polar from 'winds-mobi-client-web/components/chart/polar';
import { windDirectionMarkerColours } from 'winds-mobi-client-web/utils/wind-direction-marker';

export interface WindDirectionGraphSignature {
  Args: {
    data: History[];
    hideAxisLabels?: boolean;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

const LAST_HOUR = 1 * 60 * 60 * 1000;

export default class WindDirectionGraph extends Component<WindDirectionGraphSignature> {
  @service declare intl: IntlService;

  // `@cached` keeps `chartOptions`/`points`/`chartData` returning the *same*
  // object/array references across the repeated autotracked reads Glimmer's
  // render pipeline performs in a single render pass. Without it, each read
  // built a fresh object, which made `render-highcharts`'s modifier see
  // "changed" args on every access and re-run its update mid-render -- the
  // root cause of this component's flaky marker-rendering (see TODO.md).

  // The radial window spans exactly the given data's own oldest-to-newest
  // range -- not a fixed 1-hour span anchored off either end (issue #120).
  // Anchoring to a fixed duration (e.g. `newest - 1 hour`) was tried first
  // and was wrong two ways: anchoring off wall-clock `Date.now()` let the
  // window drift away from a station that had gone quiet, leaving the graph
  // looking sparse or empty; anchoring the span off the newest reading
  // instead still assumed the returned data always covers a full hour, so
  // any time it covered less (a quiet spell, a station just back online)
  // the real oldest reading sat inside that assumed boundary while nothing
  // else moved to match -- not itself a visible bug, but proof the window
  // and the data could disagree. Deriving both ends directly from the
  // data's own extremes make that impossible by construction: no point can
  // ever fall outside axis bounds that are its own dataset's bounds. `data`
  // is chronological (oldest first, see app/handlers/history.ts), so the
  // first/last elements are the two extremes.
  @cached
  get windowBounds() {
    const data = this.args.data ?? [];

    if (data.length === 0) {
      const now = Date.now();

      return { min: now - LAST_HOUR, max: now };
    }

    // A single reading has no range of its own to derive from -- fall back
    // to a 1-hour span so it still draws as a spoke (see `points` below)
    // instead of collapsing both axis ends onto the same value.
    if (data.length === 1) {
      const only = data[0]!.timestamp;

      return { min: only - LAST_HOUR, max: only };
    }

    return {
      min: data[0]!.timestamp,
      max: data[data.length - 1]!.timestamp,
    };
  }

  @cached
  get chartOptions() {
    const { min: minTimestamp, max: maxTimestamp } = this.windowBounds;

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
        max: maxTimestamp,
        // Highcharts' radial axis places `min` at the pane center and `max`
        // at the outer edge by default, so the newest reading lands right
        // on the outer ring and the oldest reading sits at the center, with
        // everything else spread linearly between (issue #120). A point
        // exactly at the center can't show a direction (the angle is
        // meaningless at radius 0), so this deliberately keeps the newest
        // reading away from the center, not on it.
        //
        // No interval rings -- just the single outer boundary from the pane
        // itself. `startOnTick`/`endOnTick` default to true, which would
        // otherwise snap the *rendered* extremes to Highcharts' own
        // auto-picked "nice" tick values instead of our exact `min`/`max`;
        // since real timestamps essentially never land on those values, the
        // rendered max would end up slightly less than the newest reading's
        // own timestamp, pushing it past 100% radius and outside the ring
        // entirely. Disabling both keeps the axis pinned to the exact
        // bounds we give it.
        startOnTick: false,
        endOnTick: false,
        gridLineWidth: 0,
      },
    };
  }

  @cached
  get points() {
    const data = this.args.data ?? [];

    if (data.length === 0) {
      return [];
    }

    const mapped = data.map((elm) => {
      const { lineColor, fillColor } = windDirectionMarkerColours(
        elm.speed,
        elm.gusts
      );

      return {
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

    // A single reading on its own would render as one dot on the outer
    // ring -- technically direction-legible, but easy to miss. Add an
    // unmarked point at the center in the same direction so it draws as a
    // full spoke from center to edge instead, reading like a compass needle
    // (issue #120, point 4).
    if (mapped.length === 1) {
      const reading = mapped[0]!;

      return [
        reading,
        {
          x: reading.x,
          y: this.windowBounds.min,
          color: reading.color,
          marker: { enabled: false },
          customTooltip: reading.customTooltip,
        },
      ];
    }

    return mapped;
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
    <Polar
      class="h-full min-h-0 min-w-0 w-full"
      @chartData={{this.chartData}}
      @chartOptions={{this.chartOptions}}
    />
  </template>
}
