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

// Stronger gusts than a typical light-wind reading: windbarb's barb shape
// is Beaufort/knot-derived (see highcharts-options.ts's KM_H_PER_M_S
// comment), so a weak sample speed draws as a bare stem or a single
// half-feather and barely reads as a wind barb at all. These are picked to
// each grow a visibly different number of feathers.
const SAMPLE_READINGS = [
  { speed: 45, direction: 20 },
  { speed: 65, direction: 110 },
  { speed: 50, direction: 250 },
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
      margin: [4, 4, 4, 4],
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
          class="h-14 w-32"
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
