import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import renderHighcharts from 'winds-mobi-client-web/modifiers/render-highcharts';
import {
  mergeChartOptions,
  type ChartOptions,
} from 'winds-mobi-client-web/utils/highcharts-options';
import { type TimeSeriesPoint } from 'winds-mobi-client-web/utils/chart-series';

interface TimeSeriesChartOptions extends ChartOptions {
  chart?: ChartOptions;
  plotOptions?: ChartOptions;
  responsive?: ChartOptions;
  rangeSelector?: ChartOptions;
  tooltip?: ChartOptions;
  xAxis?: ChartOptions;
}

export interface TimeSeriesSignature {
  Args: {
    stationId: string;
    chartOptions?: TimeSeriesChartOptions;
    chartData?: TimeSeriesSeries[];
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

// The "6h" button -- see `rangeSelector.buttons` below. Shared with the
// `renderHighcharts` modifier invocation so the two can't silently drift
// apart.
const DEFAULT_RANGE_SELECTOR_INDEX = 4;

interface TimeSeriesSeries extends ChartOptions {
  name: string;
  data: TimeSeriesPoint[];
}

export default class TimeSeries extends Component<TimeSeriesSignature> {
  defaultChartOptions: TimeSeriesChartOptions = {
    time: {
      timezone: undefined,
    },
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
    // throwing on null/gap points, see utils/chart-series.ts) can't happen
    // any more; there's simply no such code loaded to run. Highcharts still
    // emits an advisory console warning whenever `accessibility.enabled`
    // isn't set at all and the module isn't loaded, though, so this stays
    // just to keep that warning quiet.
    accessibility: {
      enabled: false,
    },
    chart: {
      height: 272,
      reflow: true,
      spacingLeft: 0,
      spacingRight: 0,
      type: 'spline',
      panning: {
        enabled: true,
        type: 'x',
      },
      spacingBottom: 6,
      spacingTop: 6,
      zoomType: 'x',
    },
    rangeSelector: {
      inputEnabled: false,
      buttons: [
        {
          type: 'day',
          count: 5,
          text: '5d',
        },
        {
          type: 'day',
          count: 2,
          text: '2d',
        },
        {
          type: 'day',
          count: 1,
          text: '1d',
        },
        {
          type: 'hour',
          count: 12,
          text: '12h',
        },
        {
          type: 'hour',
          count: 6,
          text: '6h',
        },
      ],
      buttonSpacing: 4,
      buttonTheme: {
        height: 24,
        padding: 3,
        r: 6,
        style: {
          fontSize: '12px',
          fontWeight: '600',
        },
      },
      selected: DEFAULT_RANGE_SELECTOR_INDEX,
      labelStyle: {
        fontSize: '12px',
      },
    },
    title: {
      text: undefined,
    },
    xAxis: {
      type: 'datetime',
      gridLineWidth: 1,
      crosshair: true,
      labels: {
        style: {
          fontSize: '12px',
          lineHeight: '14px',
        },
        useHTML: true,
        formatter: function (this: {
          chart: {
            time: { dateFormat: (format: string, timestamp: number) => string };
          };
          value: number;
        }) {
          return `${this.chart.time.dateFormat(
            '%H:%M',
            this.value
          )}<br/>${this.chart.time.dateFormat('%a', this.value)}`;
        },
      },
    },
    legend: {
      enabled: false,
    },
    navigator: {
      enabled: false,
    },
    scrollbar: {
      enabled: true,
    },
    plotOptions: {
      series: {
        animation: {
          duration: 0,
        },
      },
    },
    tooltip: {
      xDateFormat: '%e %b %H:%M',
      shared: true,
      crosshairs: true,
      outside: true,
      valueDecimals: 0,
    },
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 420,
          },
          chartOptions: {
            xAxis: {
              labels: {
                style: {
                  fontSize: '11px',
                  lineHeight: '13px',
                },
              },
            },
          },
        },
        {
          condition: {
            maxWidth: 360,
          },
          chartOptions: {
            xAxis: {
              labels: {
                style: {
                  fontSize: '10px',
                  lineHeight: '12px',
                },
              },
            },
          },
        },
      ],
    },
  };

  @cached
  get mergedChartOptions() {
    return mergeChartOptions(this.defaultChartOptions, this.args.chartOptions, [
      'chart',
      'xAxis',
      'tooltip',
      'plotOptions',
      'rangeSelector',
      'responsive',
    ]);
  }

  <template>
    <div
      class="chart-container"
      {{renderHighcharts
        "stockChart"
        this.mergedChartOptions
        @chartData
        stationId=@stationId
        defaultRangeSelectorIndex=DEFAULT_RANGE_SELECTOR_INDEX
      }}
    ></div>
  </template>
}
