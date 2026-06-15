import { LinkTo } from '@ember/routing';
import { t } from 'ember-intl';
import NavbarRefreshControl from '../refresh-control';
import { NAVBAR_MENU_ITEMS } from './items';

<template>
  <div class="hidden items-center gap-1 md:flex">
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

    <span class="mx-1 h-6 w-px bg-slate-200"></span>

    <NavbarRefreshControl @appearance="desktop" />
  </div>
</template>
