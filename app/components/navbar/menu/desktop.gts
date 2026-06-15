import { LinkTo } from '@ember/routing';
import { t } from 'ember-intl';
import { NAVBAR_MENU_ITEMS } from './items';

<template>
  <div class="hidden items-center gap-1 md:flex">
    {{#each NAVBAR_MENU_ITEMS as |item|}}
      <LinkTo
        @route={{item.route}}
        class="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 aria-[current=page]:border-wind-20 aria-[current=page]:bg-wind-20 aria-[current=page]:text-white"
        data-test-navbar-link={{item.route}}
      >
        <item.icon @size={{16}} />
        {{t item.labelKey}}
      </LinkTo>
    {{/each}}
  </div>
</template>
