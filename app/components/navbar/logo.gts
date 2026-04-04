import { hash } from '@ember/helper';
import { LinkTo } from '@ember/routing';
import { t } from 'ember-intl';
import {
  DEFAULT_MAP_LAT,
  DEFAULT_MAP_LNG,
  DEFAULT_MAP_ZOOM,
} from 'winds-mobi-client-web/utils/map-view';

<template>
  <LinkTo
    @route="map"
    @query={{hash
      mapLat=DEFAULT_MAP_LAT
      mapLng=DEFAULT_MAP_LNG
      mapZoom=DEFAULT_MAP_ZOOM
    }}
    class="group flex flex-shrink-0 items-center gap-2"
    data-test-navbar-logo
  >
    <img class="h-8 w-auto" src="/logo.svg" alt={{t "application.name"}} />
    <span
      class="hidden whitespace-nowrap rounded-full bg-slate-900 px-2.5 py-1 text-sm font-black tracking-[0.01em] text-white shadow-sm ring-1 ring-slate-950/10 transition group-hover:bg-slate-800 sm:inline-flex"
    >
      {{t "application.name"}}
    </span>
  </LinkTo>
</template>
