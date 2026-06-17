import Component from '@glimmer/component';
import { opacityForReadingAge } from 'winds-mobi-client-web/utils/station-arrow';
import SettingsWindArrow from 'winds-mobi-client-web/components/settings/wind-arrow';

export interface SettingsShowcaseFadeSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// The same station shown at three reading ages. With the preference on, older
// readings fade toward transparent exactly as the on-map markers do; with it
// off every arrow stays fully opaque whatever its age.
const SAMPLES = [
  { label: 'now', ageMinutes: 0 },
  { label: '10 min', ageMinutes: 10 },
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
    <div
      class="flex items-center justify-center gap-4 rounded-lg bg-slate-100 p-4"
      ...attributes
    >
      {{#each this.samples as |sample|}}
        <div class="flex flex-col items-center gap-1">
          <SettingsWindArrow
            class="h-12 w-12"
            @direction={{135}}
            @speed={{18}}
            @gusts={{32}}
            @showGusts={{true}}
            @opacity={{sample.opacity}}
          />
          <span class="text-[10px] text-slate-500">{{sample.label}}</span>
        </div>
      {{/each}}
    </div>
  </template>
}
