import Component from '@glimmer/component';

import { DIRECTIONS } from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import renderHighcharts from 'winds-mobi-client-web/modifiers/render-highcharts';
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
          // Thumbnail size (e.g. a compact nearby-list row): the N/E/S/W
          // labels have no room to render legibly, so drop them entirely and
          // let the polar pane fill almost the whole box as a plain dot scatter.
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
                enabled: false,
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
