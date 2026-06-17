import { array } from '@ember/helper';
import { t } from 'ember-intl';
import Link from 'ember-phosphor-icons/components/ph-link';
import LinkBreak from 'ember-phosphor-icons/components/ph-link-break';

export interface SettingsShowcaseGraphSyncSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// Two stacked mini graphs (wind + air). When synced, a single shared vertical
// cursor crosses both at the same time; when not, each has its own. A link /
// broken-link badge sits between them.
<template>
  <div class="relative grid gap-2 rounded-lg bg-slate-100 p-3" ...attributes>
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

    <span
      class="absolute left-1/2 top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 shadow-sm"
      aria-hidden="true"
    >
      {{#if @enabled}}
        <Link @size={{14}} />
      {{else}}
        <LinkBreak @size={{14}} />
      {{/if}}
    </span>
  </div>
</template>
