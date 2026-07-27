import type { TOC } from '@ember/component/template-only';
import ArrowUp from 'ember-phosphor-icons/components/ph-arrow-up';

export interface SettingsShowcaseWindDirectionSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// A mini mock of the wind history chart's top edge (see
// app/components/station/wind/presenter.gts): a row of small rotated arrows
// appears above a flat line when enabled, echoing the real windbarb row,
// and disappears to a plain line when off.
const SettingsShowcaseWindDirection: TOC<SettingsShowcaseWindDirectionSignature> =
  <template>
    <div
      class="flex flex-col items-center justify-center gap-2 rounded-lg bg-slate-100 p-4"
      ...attributes
    >
      <div class="flex h-4 items-center gap-3">
        {{#if @enabled}}
          <ArrowUp @size={{14}} class="rotate-[340deg] text-wind-15" />
          <ArrowUp @size={{14}} class="rotate-[35deg] text-wind-25" />
          <ArrowUp @size={{14}} class="rotate-[350deg] text-wind-10" />
        {{/if}}
      </div>
      <div class="h-px w-24 bg-slate-300"></div>
    </div>
  </template>;

export default SettingsShowcaseWindDirection;
