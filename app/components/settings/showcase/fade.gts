import Component from '@glimmer/component';
import { opacityForReadingAge } from 'winds-mobi-client-web/utils/station-arrow';
import SettingsWindArrow from 'winds-mobi-client-web/components/settings/wind-arrow';

export interface SettingsShowcaseFadeSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// Four sample readings spread across the fade window. With the preference on the
// arrows fade fresh→old exactly as the on-map markers do — near-opaque for the
// first ten minutes or so, then dropping faster toward thirty; with it off every
// arrow stays fully opaque. They sit on a banded vertical gradient so the growing
// transparency is obvious as the darker bands show through the faded arrows.
const SAMPLES = [
  { label: 'now', ageMinutes: 0 },
  { label: '10 min', ageMinutes: 10 },
  { label: '20 min', ageMinutes: 20 },
  { label: '30 min', ageMinutes: 30 },
];

export default class SettingsShowcaseFade extends Component<SettingsShowcaseFadeSignature> {
  get samples() {
    return SAMPLES.map(({ label, ageMinutes }) => ({
      label,
      opacity: this.args.enabled
        ? opacityForReadingAge(Date.now() - ageMinutes * 60 * 1000)
        : 1,
    }));
  }

  <template>
    <div class="overflow-hidden rounded-lg" ...attributes>
      <div
        class="grid grid-cols-4 items-center bg-[linear-gradient(to_bottom,#f1f5f9_0%,#94a3b8_35%,#f1f5f9_65%,#475569_100%)] px-2 py-4"
      >
        {{#each this.samples as |sample|}}
          <SettingsWindArrow
            class="mx-auto h-10 w-10"
            @direction={{135}}
            @speed={{18}}
            @gusts={{32}}
            @showGusts={{true}}
            @opacity={{sample.opacity}}
          />
        {{/each}}
      </div>
      <div
        class="grid grid-cols-4 bg-slate-100 px-2 py-1 text-center text-[10px] text-slate-500"
      >
        {{#each this.samples as |sample|}}
          <span>{{sample.label}}</span>
        {{/each}}
      </div>
    </div>
  </template>
}
