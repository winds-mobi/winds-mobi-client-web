import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import renderHighcharts from 'winds-mobi-client-web/modifiers/render-highcharts';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';
import { KM_H_PER_M_S } from 'winds-mobi-client-web/utils/highcharts-options';

export interface SettingsShowcaseWindDirectionSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// From calm (0 -- windbarb draws Beaufort level 0 as a plain circle, not a
// stem) up to a strong-ish gust, each step growing a visibly different
// number of feathers -- windbarb's barb shape is Beaufort/knot-derived (see
// highcharts-options.ts's KM_H_PER_M_S comment).
const SAMPLE_READINGS = [
  { speed: 0, direction: 0 },
  { speed: 10, direction: 45 },
  { speed: 20, direction: 120 },
  { speed: 30, direction: 200 },
  { speed: 40, direction: 300 },
];

// Renders the *real* Highcharts windbarb series (via the same
// renderHighcharts modifier the actual wind history chart uses -- see
// app/components/station/wind/presenter.gts) at a tiny size, rather than
// approximating the look with generic rotated icons. What a user sees here
// is genuinely the same rendering the real chart produces, not a mockup of
// it.
export default class SettingsShowcaseWindDirection extends Component<SettingsShowcaseWindDirectionSignature> {
  chartOptions = {
    chart: {
      height: 56,
      margin: [4, 12, 4, 12],
      animation: false,
    },
    title: { text: undefined },
    credits: { enabled: false },
    legend: { enabled: false },
    accessibility: { enabled: false },
    xAxis: { visible: false, min: -0.5, max: SAMPLE_READINGS.length - 0.5 },
    yAxis: { visible: false },
    tooltip: { enabled: false },
  };

  @cached
  get chartData() {
    return [
      {
        name: 'Direction',
        type: 'windbarb',
        // This preview is a handful of fixed decorative points, not a real
        // time series -- windbarb's own `dataGrouping.enabled: true`
        // default (needed for the crash fix above) would otherwise combine
        // several of them into one grouped point at a narrow width like
        // this (`groupPixelWidth: 30`), which is what "only one arrow,
        // stuck at one side" actually was.
        dataGrouping: { enabled: false },
        data: SAMPLE_READINGS.map((reading, index) => ({
          x: index,
          value: reading.speed / KM_H_PER_M_S,
          direction: reading.direction,
          color: windToColour(reading.speed),
        })),
      },
    ];
  }

  <template>
    <div
      class="flex items-center justify-center rounded-lg bg-slate-100 p-4"
      ...attributes
    >
      {{#if @enabled}}
        <div
          class="h-14 w-full"
          {{renderHighcharts
            "chart"
            this.chartOptions
            this.chartData
            needsWindbarb=true
          }}
        ></div>
      {{else}}
        <div class="h-px w-24 bg-slate-300"></div>
      {{/if}}
    </div>
  </template>
}
