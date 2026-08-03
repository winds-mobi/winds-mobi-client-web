import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import type { History } from 'winds-mobi-client-web/services/store.js';
import { service } from '@ember/service';
import { type IntlService } from 'ember-intl';
import Polar from 'winds-mobi-client-web/components/chart/polar';
import {
  cardinalOnlyDirectionLabel,
  COMPASS_LABEL_FONT_FAMILY,
} from 'winds-mobi-client-web/utils/compass-labels';
import { windDirectionMarkerColours } from 'winds-mobi-client-web/utils/wind-direction-marker';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';

export interface WindDirectionGraphSignature {
  Args: {
    data: History[];
    // For a consumer that's always small by design (e.g. the nearby-list
    // thumbnail), not just incidentally narrow. Polar's own maxWidth:90
    // responsive rule already drops to cardinal-only labels based on the
    // chart's *measured* width, but a compact grid card can easily render
    // wider than that threshold depending on viewport/column count while
    // still being "the small one" by intent -- this forces the same
    // cardinal-only label set regardless of actual measured width.
    compact?: boolean;
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

  // The radial window is always exactly one hour wide, anchored on the newest
  // reading: the outer ring is the last measurement and the center is exactly
  // an hour before it, whether or not a reading exists at that instant. That
  // makes the radius a constant time scale, so radial distance always means
  // the same number of minutes and a quiet spell reads as an empty inner (or
  // outer) area rather than silently rescaling the whole graph.
  //
  // The anchor is the newest reading, never wall-clock `Date.now()`: anchoring
  // off `Date.now()` (tried in issue #120) let the window drift away from a
  // station that had gone quiet, leaving the graph looking sparse or empty.
  // The historic API returns the last `duration` seconds relative to the
  // station's own latest entry, so with `duration` of 1 hour no reading can
  // fall outside these bounds. `data` is chronological (oldest first, see
  // app/handlers/history.ts), so the last element is the newest reading.
  @cached
  get windowBounds() {
    const data = this.args.data ?? [];
    // With no data at all there is no reading to anchor to; show the hour
    // ending now, so the empty graph still draws its ring at a sane scale.
    const newest = data[data.length - 1]?.timestamp ?? Date.now();

    return { min: newest - LAST_HOUR, max: newest };
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
      // Matches the distance/font-size Polar's own maxWidth:90 responsive
      // rule uses for a genuinely narrow chart, so a compact consumer looks
      // the same whether or not its actual measured width happens to cross
      // that threshold.
      ...(this.args.compact
        ? {
            xAxis: {
              labels: {
                formatter: function ({ value }: { value: number }) {
                  return cardinalOnlyDirectionLabel(value);
                },
                distance: '78%',
                style: {
                  fontSize: '10px',
                  fontFamily: COMPASS_LABEL_FONT_FAMILY,
                },
              },
            },
          }
        : {}),
      yAxis: {
        min: minTimestamp,
        max: maxTimestamp,
        // Highcharts' radial axis places `min` at the pane center and `max`
        // at the outer edge by default, so the newest reading lands right
        // on the outer ring and an hour earlier sits at the center, with
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

  // Mirrors the markup Highcharts' own default tooltip uses, which is what
  // the wind history chart renders (see chart/time-series.gts): a smaller
  // time header, then one line per value made of a wind-band-coloured
  // bullet, the label, and the value in bold. Highcharts parses this subset
  // of HTML inside its SVG text, so the tooltip needs no `useHTML` -- and a
  // `var(--color-wind-NN)` colour resolves there just as it already does for
  // the wind chart's zone-coloured bullets. Gusts come first to match the
  // "Last hour" panel's own cards, which lead with the hour's maximum gust.
  #tooltipFor(reading: History) {
    const time = this.intl.formatTime(reading.timestamp, {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const rows = [
      { label: this.intl.t('wind.gusts'), value: reading.gusts },
      { label: this.intl.t('wind.speed'), value: reading.speed },
    ];

    return [
      `<span style="font-size: 0.8em">${time}</span>`,
      ...rows.map(
        ({ label, value }) =>
          `<span style="color:${windToColour(
            value
          )}">●</span> ${label}: <b>${this.intl.formatNumber(value, {
            format: 'windSpeed',
          })}</b>`
      ),
    ].join('<br/>');
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
        customTooltip: this.#tooltipFor(elm),
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
