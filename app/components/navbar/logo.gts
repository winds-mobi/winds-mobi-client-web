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
    class="flex flex-shrink-0 items-center gap-2"
    data-test-navbar-logo
  >
    <img class="h-8 w-auto" src="/logo.svg" alt={{t "application.name"}} />
    <span
      class="hidden whitespace-nowrap text-base font-black tracking-[0.01em] text-slate-950 sm:inline"
    >
      {{t "application.name"}}
    </span>
  </LinkTo>
</template>
