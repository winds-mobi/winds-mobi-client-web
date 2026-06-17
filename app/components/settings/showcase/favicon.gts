import { t } from 'ember-intl';
import Wind from 'ember-phosphor-icons/components/ph-wind';
import SettingsWindArrow from 'winds-mobi-client-web/components/settings/wind-arrow';

export interface SettingsShowcaseFaviconSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// A small browser-tab mock: when the preference is on, the favicon slot holds
// the selected station's wind arrow; when off, it falls back to the generic
// winds.mobi mark.
<template>
  <div
    class="flex items-center gap-2 rounded-t-lg border border-b-0 border-slate-300 bg-slate-100 px-3 py-2 shadow-inner"
    ...attributes
  >
    <span class="flex h-4 w-4 shrink-0 items-center justify-center">
      {{#if @enabled}}
        <SettingsWindArrow
          class="h-4 w-4"
          @direction={{135}}
          @speed={{18}}
          @gusts={{32}}
          @showGusts={{true}}
        />
      {{else}}
        <Wind @size={{16}} class="text-wind-20" />
      {{/if}}
    </span>
    <span class="truncate text-xs font-medium text-slate-600">winds.mobi</span>
    <span
      class="ml-auto text-[10px] uppercase tracking-wide text-slate-400"
    >{{if
        @enabled
        (t "settings.preview.faviconStation")
        (t "settings.preview.faviconDefault")
      }}</span>
  </div>
</template>
