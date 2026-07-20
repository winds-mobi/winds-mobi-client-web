import type { TOC } from '@ember/component/template-only';
import Heart from 'ember-phosphor-icons/components/ph-heart';

export interface SettingsShowcaseFavoritesSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// A mini station-header mock: the favourite heart button appears next to the
// name exactly as it does on a real station panel (see
// app/components/station/header.gts), only when enabled.
const SettingsShowcaseFavorites: TOC<SettingsShowcaseFavoritesSignature> =
  <template>
    <div
      class="flex items-center justify-between gap-2 rounded-lg bg-slate-100 p-3"
      ...attributes
    >
      <span class="text-sm font-semibold text-slate-950">Höhematte</span>
      {{#if @enabled}}
        <Heart @size={{20}} @weight="regular" class="text-slate-400" />
      {{/if}}
    </div>
  </template>;

export default SettingsShowcaseFavorites;
