import { LinkTo } from '@ember/routing';
import { t } from 'ember-intl';
import { NAVBAR_MENU_ITEMS } from './items';

<template>
  <div class="hidden min-w-0 flex-1 md:flex">
    <div class="flex flex-1 justify-center">
      <div class="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
        {{#each NAVBAR_MENU_ITEMS as |item|}}
          <LinkTo
            @route={{item.route}}
            @activeClass="bg-white text-wind-20 shadow-sm shadow-slate-900/10"
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-white/70 hover:text-wind-20"
            data-test-navbar-link={{item.route}}
          >
            <item.icon @size={{14}} />
            {{t item.labelKey}}
          </LinkTo>
        {{/each}}
      </div>
    </div>
  </div>
</template>
