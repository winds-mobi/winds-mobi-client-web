import Component from '@glimmer/component';
import { scaleForReadingAge } from 'winds-mobi-client-web/utils/station-arrow';
import SettingsWindArrow from 'winds-mobi-client-web/components/settings/wind-arrow';

export interface SettingsShowcaseShrinkSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// Four sample readings spread across the shrink window. With the preference on
// the arrows shrink fresh→old exactly as the on-map markers do — near-full-size
// for the first ten minutes or so, then getting smaller faster toward thirty;
// with it off every arrow stays full size whatever its age.
const SAMPLES = [
  { label: 'now', ageMinutes: 0 },
  { label: '10 min', ageMinutes: 10 },
  { label: '20 min', ageMinutes: 20 },
  { label: '30 min', ageMinutes: 30 },
];

export default class SettingsShowcaseShrink extends Component<SettingsShowcaseShrinkSignature> {
  get samples() {
    return SAMPLES.map(({ label, ageMinutes }) => ({
      label,
      scale: this.args.enabled
        ? scaleForReadingAge(Date.now() - ageMinutes * 60 * 1000)
        : 1,
    }));
  }

  <template>
    <div class="grid grid-cols-4 rounded-lg bg-slate-100 p-3" ...attributes>
      {{#each this.samples as |sample|}}
        <div class="flex flex-col items-center gap-1">
          <SettingsWindArrow
            class="h-12 w-12"
            @direction={{135}}
            @speed={{15}}
            @gusts={{40}}
            @showGusts={{true}}
            @scale={{sample.scale}}
          />
          <span class="text-[10px] text-slate-500">{{sample.label}}</span>
        </div>
      {{/each}}
    </div>
  </template>
}
