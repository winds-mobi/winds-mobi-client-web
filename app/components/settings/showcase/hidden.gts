import type { TOC } from '@ember/component/template-only';
import Eye from 'ember-phosphor-icons/components/ph-eye';

export interface SettingsShowcaseHiddenSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// A mini station-header mock: the hide button appears next to the name exactly
// as it does on a real station panel (see app/components/station/index.gts),
// only when enabled.
const SettingsShowcaseHidden: TOC<SettingsShowcaseHiddenSignature> = <template>
  <div
    class="flex items-center justify-between gap-2 rounded-lg bg-slate-100 p-3"
    ...attributes
  >
    <span class="text-sm font-semibold text-slate-950">SLF-PMA2</span>
    {{#if @enabled}}
      <Eye @size={{20}} @weight="regular" class="text-slate-400" />
    {{/if}}
  </div>
</template>;

export default SettingsShowcaseHidden;
