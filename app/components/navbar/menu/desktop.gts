import { LinkTo } from '@ember/routing';
import { t } from 'ember-intl';
import { NAVBAR_MENU_ITEMS } from './items';

<template>
  <div class="hidden min-w-0 flex-1 md:flex">
    <div class="flex flex-1 justify-center px-3 sm:px-6">
      <div class="inline-flex items-center gap-4">
        {{#each NAVBAR_MENU_ITEMS as |item|}}
          <LinkTo
            @route={{item.route}}
            @activeClass="border-slate-900 text-slate-950"
            class="border-b-2 border-transparent px-2 py-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            data-test-navbar-link={{item.route}}
          >
            {{t item.labelKey}}
          </LinkTo>
        {{/each}}
      </div>
    </div>
  </div>
</template>
