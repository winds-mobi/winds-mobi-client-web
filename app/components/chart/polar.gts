import Component from '@glimmer/component';
import HighCharts from 'ember-highcharts/components/high-charts';
import type { Options } from 'highcharts';

import { DIRECTIONS } from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import {
  cardinalOnlyDirectionLabel,
  COMPASS_LABEL_FONT_FAMILY,
} from 'winds-mobi-client-web/utils/compass-labels';
import {
  mergeChartOptions,
  type ChartOptions,
} from 'winds-mobi-client-web/utils/highcharts-options';

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
    chartData?: Options['series'];
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
    // ember-highcharts always imports the accessibility module, but its
    // keyboard-navigation point proxies can throw ("Invalid value for <rect>
    // attribute y=NaN") on sparse scatter series (e.g. a station that only
    // reports every 30 minutes may have just one point in the last-hour
    // window). This chart's data is also available via the metric cards and
    // tooltips, so the a11y module isn't adding real value here.
    accessibility: {
      enabled: false,
    },
    chart: {
      polar: true,
      reflow: true,
      type: 'line',
      spacing: [0, 0, 0, 0],
      // ember-highcharts updates an existing chart via series.setData()
      // rather than always destroying/recreating it (e.g. when a station
      // switch resolves from cache without a loading gap in between).
      // Highcharts' default point-matching then falls back to raw x value
      // (wind direction here, a coarse 0-360 value) when it can't match an
      // incoming point by id, which displaces a point to the wrong position
      // in the array when two stations' data happen to share a direction
      // (issue #111 -- the "tangled path" glitch). Disabling this lets
      // Highcharts always rebuild series data from the given array's own
      // order instead of trying to reuse/match old points -- measured no
      // meaningful performance difference at this chart's data volumes
      // (a handful to a few dozen points, one hour of history).
      allowMutatingData: false,
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
        formatter: function ({ value }: { value: number }) {
          return DIRECTIONS[Math.round(value / 45)];
        },
        distance: '86%',
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
                distance: '78%',
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
    <HighCharts
      ...attributes
      @content={{@chartData}}
      @chartOptions={{this.mergedChartOptions}}
    />
  </template>
}
