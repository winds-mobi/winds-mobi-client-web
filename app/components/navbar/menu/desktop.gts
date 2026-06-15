import { LinkTo } from '@ember/routing';
import { t } from 'ember-intl';
import { NAVBAR_MENU_ITEMS } from './items';

<template>
  <div class="hidden items-center gap-1 md:flex">
    {{#each NAVBAR_MENU_ITEMS as |item|}}
      <LinkTo
        @route={{item.route}}
        @activeClass="text-wind-20"
        class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        data-test-navbar-link={{item.route}}
      >
        <item.icon @size={{16}} />
        {{t item.labelKey}}
      </LinkTo>
    {{/each}}
  </div>
</template>
