import type { TOC } from '@ember/component/template-only';
import Bell from 'ember-phosphor-icons/components/ph-bell';

export interface SettingsShowcaseAlarmsSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// A mini station-header mock: the alarm bell button appears next to the name
// exactly as it does on a real station panel (see
// app/components/station/header.gts), only when enabled.
const SettingsShowcaseAlarms: TOC<SettingsShowcaseAlarmsSignature> = <template>
  <div
    class="flex items-center justify-between gap-2 rounded-lg bg-slate-100 p-3"
    ...attributes
  >
    <span class="text-sm font-semibold text-slate-950">Höhematte</span>
    {{#if @enabled}}
      <Bell @size={{20}} @weight="regular" class="text-slate-400" />
    {{/if}}
  </div>
</template>;

export default SettingsShowcaseAlarms;
