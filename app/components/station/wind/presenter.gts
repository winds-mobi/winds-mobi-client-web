import Component from '@glimmer/component';
import { service } from '@ember/service';
import { cached } from '@glimmer/tracking';
import type { IntlService } from 'ember-intl';
import TimeSeries, {
  type TimeSeriesSeries,
} from 'winds-mobi-client-web/components/chart/time-series';
import azimuthToCardinal from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import { windColourZones } from 'winds-mobi-client-web/helpers/wind-to-colour';
import type { History } from 'winds-mobi-client-web/services/store.js';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import {
  defaultYAxis,
  seriesFor,
  windbarbSeriesFor,
  KM_H_PER_M_S,
} from 'winds-mobi-client-web/utils/highcharts-options';

export interface StationWindContentSignature {
  Args: {
    history: History[];
    stationId: string;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationWindContent extends Component<StationWindContentSignature> {
  @service declare intl: IntlService;
  @service declare settings: SettingsService;

  zones = windColourZones();

  // Beta feature (see app/services/settings.ts): the Direction windbarb
  // series, its dedicated axis, and the extra Highcharts module it needs
  // are all skipped entirely while this is false, not just hidden -- a
  // user who hasn't opted in pays no extra computation, network, or axis
  // bookkeeping for it.
  get windDirectionEnabled() {
    return (
      this.settings.betaFeaturesEnabled &&
      this.settings.windDirectionHistoryEnabled
    );
  }

  // Same zones as Wind/Gusts (this.zones), converted to windbarb's own
  // m/s `value` unit. @cached for the same reason as chartData below --
  // without it, Glimmer's render pipeline would see a new array on every
  // autotracked read and re-run the chart-update modifier mid-render (see
  // wind-direction/graph.gts's identical comment on this).
  @cached
  get windbarbZones() {
    return this.zones.map((zone) => ({
      ...zone,
      value: zone.value === undefined ? undefined : zone.value / KM_H_PER_M_S,
    }));
  }

  @cached
  get chartData() {
    const speed = seriesFor(this.args.history, 'speed');
    const gusts = seriesFor(this.args.history, 'gusts');
    const windDirectionEnabled = this.windDirectionEnabled;

    const series: TimeSeriesSeries[] = [
      {
        name: 'Wind',
        data: speed,
        fillOpacity: 0.16,
        tooltip: {
          valueSuffix: 'km/h',
        },
        type: 'area',
        ...(windDirectionEnabled ? { yAxis: 1 } : {}),
        zoneAxis: 'y',
        zones: this.zones,
      },
      {
        name: 'Gusts',
        data: gusts,
        dashStyle: 'ShortDash',
        dataGrouping: {
          approximation: 'high',
        },
        lineWidth: 2.5,
        tooltip: {
          valueSuffix: 'km/h',
        },
        ...(windDirectionEnabled ? { yAxis: 1 } : {}),
        zoneAxis: 'y',
        zones: this.zones,
      },
    ];

    if (windDirectionEnabled) {
      const direction = windbarbSeriesFor(this.args.history);
      const intl = this.intl;

      series.push({
        name: 'Direction',
        data: direction,
        type: 'windbarb',
        yAxis: 0,
        // Positive, not windbarb's own default (-20): axis 0 below is
        // pinned to the very top of the chart, so windbarb's usual "anchor
        // to the axis's bottom edge, then nudge up by 20px" default would
        // push the arrows up into (or past) the chart's own top margin.
        // Nudging down instead keeps them just inside the visible area,
        // with a bit of breathing room above them.
        yOffset: 18,
        // zoneAxis/zones (not a precomputed per-point `color`) and
        // pointFormatter (not a precomputed per-point tooltip string, not
        // Highcharts' own default {point.value}/{point.beaufort} format)
        // both read the point's *own* value/direction at render/tooltip
        // time. That matters specifically for this series: at a zoomed-out
        // range, Highcharts Stock's data grouping recomputes a grouped
        // point's value/direction via windbarb's built-in vector-average
        // approximation, but never recomputes arbitrary extra point
        // properties -- a precomputed field would silently keep showing
        // one raw reading from the group while the barb itself (correctly)
        // shows the group's average, which is exactly the "label doesn't
        // match the arrow" bug this replaced. `zoneAxis: 'value'`, not the
        // default 'y': Highcharts' zone matching is a plain
        // `point[zoneAxis]` lookup (Point#getZone), and a windbarb point
        // has no `y` at all -- only `value`/`direction` -- so `zoneAxis:
        // 'y'` would read `undefined` for every point and silently pin
        // every barb to the first zone's colour regardless of speed.
        zoneAxis: 'value',
        zones: this.windbarbZones,
        tooltip: {
          pointFormatter(this: {
            direction: number;
            series: { name: string };
          }) {
            // Rounded, unlike a raw reading's direction elsewhere in the
            // app (already a whole number from the API): a data-grouped
            // point's direction is windbarb's own vector-average of every
            // raw direction in the group, a real float
            // (e.g. 86.28656870131857), not a station-reported integer.
            // Also normalized to 0-359: that vector average is computed via
            // `Math.atan2`, which returns (-180, 180], not [0, 360) -- a
            // raw reading is always already 0-359, so this only bites a
            // grouped point. Without normalizing, azimuthToCardinal's own
            // `% 8` on a negative input stays negative in JS (unlike a
            // mathematical modulo), indexing DIRECTIONS out of bounds and
            // rendering "undefined" in the tooltip.
            const direction = ((Math.round(this.direction) % 360) + 360) % 360;

            return `${this.series.name}: ${azimuthToCardinal(
              direction
            )} ${intl.t('format.azimuth', { azimuth: direction })}<br/>`;
          },
        },
      });
    }

    return series;
  }

  @cached
  get chartOptions() {
    if (!this.windDirectionEnabled) {
      return {
        yAxis: defaultYAxis({ labels: { format: '{value:.0f} km/h' } }),
      };
    }

    return {
      // Two axes, not one, but only one takes up real space: the Direction
      // series needs its own axis (index 0) so its m/s-ish `value` field
      // never feeds into the Wind/Gusts axis's km/h auto-scaling, but
      // giving it `height: '0%'` means it contributes no reserved band of
      // its own -- the Wind/Gusts axis (index 1, what `defaultYAxis`
      // already returns, spanning the full height) draws underneath, so
      // the arrows overlay the top of that graph rather than sitting in a
      // separate strip above it. windbarb doesn't plot a real value
      // against axis 0 either way (see buildWindbarbData's comment on
      // `value` driving the barb's shape, not a y-position) -- it only
      // anchors to the axis's own pixel position, which `top: '0%'` pins
      // to the chart's top edge.
      yAxis: [
        {
          top: '0%',
          height: '0%',
          gridLineWidth: 0,
          title: { text: null },
          labels: { enabled: false },
        },
        defaultYAxis({ labels: { format: '{value:.0f} km/h' } }),
      ],
    };
  }

  <template>
    <TimeSeries
      @stationId={{@stationId}}
      @chartOptions={{this.chartOptions}}
      @chartData={{this.chartData}}
      @needsWindbarb={{this.windDirectionEnabled}}
    />
  </template>
}
