import Component from '@glimmer/component';

import { DIRECTIONS } from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import renderHighcharts from 'winds-mobi-client-web/modifiers/render-highcharts';
import {
  cardinalOnlyDirectionLabel,
  COMPASS_LABEL_FONT_FAMILY,
} from 'winds-mobi-client-web/utils/compass-labels';
import {
  mergeChartOptions,
  type ChartOptions,
} from 'winds-mobi-client-web/utils/highcharts-options';
import type { NamedSeriesOptions } from 'winds-mobi-client-web/utils/highcharts-lifecycle';

interface PolarChartOptions extends ChartOptions {
  chart?: ChartOptions;
  pane?: ChartOptions;
  plotOptions?: ChartOptions;
  responsive?: ChartOptions;
  tooltip?: ChartOptions;
  xAxis?: ChartOptions;
  yAxis?: ChartOptions;
}

export interface PolarSignature {
  Args: {
    chartOptions?: PolarChartOptions;
    chartData?: NamedSeriesOptions[];
  };
  Blocks: {
    default: [];
  };
  Element: HTMLDivElement;
}

export default class Polar extends Component<PolarSignature> {
  defaultChartOptions: PolarChartOptions = {
    credits: {
      enabled: false,
    },
    // Highcharts 13 auto-follows the OS/browser's prefers-color-scheme by
    // default (`palette.colorScheme` defaults to `'light dark'`, resolved via
    // CSS `light-dark()` on Highcharts' own inner wrapper div) -- verified by
    // reading `renderer.box.parentElement`'s inline style directly in a
    // scratch test. We only ever draw a light UI, so pin it explicitly
    // rather than silently switching palettes when a station panel is
    // viewed on a device set to dark mode.
    palette: {
      colorScheme: 'light',
    },
    // No accessibility module is imported at all (see render-highcharts.ts)
    // -- unlike ember-highcharts, which always imported it, so the crash risk
    // that used to force this option (keyboard-navigation point proxies
    // throwing on sparse scatter series) can't happen any more; there's
    // simply no such code loaded to run. Highcharts still emits an advisory
    // console warning whenever `accessibility.enabled` isn't set at all and
    // the module isn't loaded, though, so this stays just to keep that
    // warning quiet.
    accessibility: {
      enabled: false,
    },
    chart: {
      polar: true,
      reflow: true,
      type: 'line',
      spacing: [0, 0, 0, 0],
      // `plotOptions.series.animation` below only covers per-point/series
      // animation. Chart-level animation still applies to everything else --
      // notably the yAxis extremes, which shift on every background refresh
      // as `wind-direction/graph.gts`'s sliding window moves, animating every
      // point to a new radius each time. Data here always replaces outright
      // rather than transitioning between old and new state, so animation is
      // off at the chart level too, not just per-series.
      animation: false,
    },
    title: {
      text: undefined,
    },
    legend: {
      enabled: false,
    },
    xAxis: {
      tickInterval: 45,
      gridLineWidth: 0,
      min: 0,
      max: 360,
      labels: {
        // Highcharts' cartesian-oriented overflow check misjudges this
        // circular layout and crops most of the 8 compass labels down to
        // nothing (only N/S happen to pass it); `allow` renders every label
        // the formatter returns, uncropped.
        overflow: 'allow',
        formatter: function ({ value }: { value: number }) {
          return DIRECTIONS[Math.round(value / 45)];
        },
        // The pane (below and in the `responsive` rules) always fills nearly
        // the whole chart box, so a positive distance -- which places labels
        // *outside* the pane's own radius -- pushes them past the visible
        // edge. Negative keeps them inside the pane, with room for the
        // label's own text width before the edge.
        distance: '-25%',
        style: {
          fontSize: '11px',
        },
      },
    },
    yAxis: {
      min: 0,
      max: 1,
      labels: {
        enabled: false,
      },
      showLastLabel: false,
    },
    tooltip: {
      // This chart is small -- a station card, and a ~80px thumbnail in the
      // compact nearby/favourites rows -- so a multi-line tooltip would be
      // clipped by the chart box it is drawn inside by default. `outside`
      // renders it in its own container on top of the page instead, the same
      // way the wind/air charts' tooltips already do. That container only
      // gets a z-index of 3 by default (Tooltip.js: `(chartStyle?.zIndex ||
      // 0) + 3`), so without a higher one it sorts behind the station
      // panel overlay's `z-20` (map/index.gts) and renders underneath it.
      // 30 is the minimum that clears that overlay, still well below the
      // app's actual top layer, PortalTarget's `z-[2001]` (application.gts).
      style: {
        zIndex: 30,
      },
      outside: true,
      formatter: function (this: { point: { customTooltip: string } }) {
        return this.point.customTooltip;
      },
    },
    plotOptions: {
      series: {
        animation: {
          duration: 0,
        },
        color: '#aaa',
      },
    },
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 199,
          },
          chartOptions: {
            pane: {
              size: '92%',
            },
            plotOptions: {
              series: {
                lineWidth: 1.25,
                marker: {
                  radius: 2.5,
                },
              },
            },
            xAxis: {
              labels: {
                distance: '-25%',
                style: {
                  fontSize: '10px',
                },
              },
            },
          },
        },
        {
          // Thumbnail size (e.g. the last-hour card on a genuinely narrow
          // phone viewport): the full 8-way N/NE/E/SE/S/SW/W/NW label set has
          // no room to render legibly, but the 4 cardinal directions still
          // fit, so keep only those and drop the diagonals. This is a
          // fallback keyed on the chart's own measured width; a consumer that
          // is *always* compact by design (e.g. the nearby-list thumbnail)
          // should pass `@compact` to `WindDirectionGraph` instead of relying
          // on this to happen to trigger -- see graph.gts.
          condition: {
            maxWidth: 90,
          },
          chartOptions: {
            pane: {
              size: '98%',
            },
            plotOptions: {
              series: {
                lineWidth: 1,
                marker: {
                  radius: 2,
                },
              },
            },
            xAxis: {
              labels: {
                formatter: function ({ value }: { value: number }) {
                  return cardinalOnlyDirectionLabel(value);
                },
                style: {
                  fontFamily: COMPASS_LABEL_FONT_FAMILY,
                },
              },
            },
          },
        },
      ],
    },
  };

  get mergedChartOptions() {
    return mergeChartOptions(this.defaultChartOptions, this.args.chartOptions, [
      'chart',
      'xAxis',
      'yAxis',
      'tooltip',
      'pane',
      'plotOptions',
      'responsive',
    ]);
  }

  <template>
    <div
      class="chart-container"
      ...attributes
      {{renderHighcharts "chart" this.mergedChartOptions @chartData}}
    ></div>
  </template>
}
