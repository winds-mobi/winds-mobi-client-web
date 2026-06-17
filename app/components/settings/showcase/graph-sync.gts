import { array } from '@ember/helper';
import { t } from 'ember-intl';
import StationSyncToggle from 'winds-mobi-client-web/components/station/sync-toggle';

export interface SettingsShowcaseGraphSyncSignature {
  Args: {
    enabled: boolean;
    onChange: (value: boolean) => void;
  };
  Element: HTMLDivElement;
}

// Two stacked mini graphs (wind + air): when synced they share one vertical
// cursor, otherwise each has its own. Below them sits the same "Sync" toggle
// used in the station detail panel, reflecting (and driving) the preference.
<template>
  <div class="grid gap-2 rounded-lg bg-slate-100 p-3" ...attributes>
    {{#each
      (array (t "settings.preview.graphWind") (t "settings.preview.graphAir"))
      as |label index|
    }}
      <div class="rounded-md border border-slate-200 bg-white px-2 py-1.5">
        <p
          class="text-[10px] font-medium uppercase tracking-wide text-slate-400"
        >
          {{label}}
        </p>
        <svg viewBox="0 0 100 24" class="h-6 w-full" aria-hidden="true">
          <polyline
            fill="none"
            stroke="var(--color-wind-20)"
            stroke-width="2"
            points="0,18 20,10 40,14 60,5 80,12 100,7"
          />
          {{! Synced: both cursors share x=60. Otherwise the second drifts. }}
          <line
            x1={{if @enabled "60" (if index "32" "60")}}
            x2={{if @enabled "60" (if index "32" "60")}}
            y1="0"
            y2="24"
            stroke="#475569"
            stroke-width="1"
            stroke-dasharray="2 2"
          />
        </svg>
      </div>
    {{/each}}

    <div class="flex justify-center pt-1">
      <StationSyncToggle @isSelected={{@enabled}} @onChange={{@onChange}} />
    </div>
  </div>
</template>
