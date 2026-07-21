import Service from '@ember/service';
import { trackedInLocalStorage } from 'ember-tracked-local-storage';

// User-facing display preferences, persisted in the browser so they survive
// reloads and stay device-local. Each property is reactive (tracked) and
// mirrored to localStorage by ember-tracked-local-storage's
// `trackedInLocalStorage`; consumers read `settings.<name>` directly and
// re-render when it changes. The stored value is omitted while it equals
// `defaultValue`, so defaults can evolve later. ember-tracked-local-storage
// ships no TypeScript types (plain JS + JSDoc), so these fields type-check as
// `any` — acceptable here since this project has no glint/tsc gate wired up
// (see CLAUDE.md). Reset in tests via the real `service:tracked-local-storage`
// (`.clear()`/`.removeItem()`), never raw `window.localStorage` — the service
// owns an in-memory reactive cell per key that a direct `localStorage` write
// would leave stale.
export default class SettingsService extends Service {
  // Render the selected station's wind arrow as the browser-tab favicon.
  @trackedInLocalStorage({
    keyName: 'settings.faviconFollowsStation',
    defaultValue: true,
  })
  faviconFollowsStation!: boolean;

  // Draw the gusts-coloured outline around wind arrows on the map.
  @trackedInLocalStorage({
    keyName: 'settings.showGustsOutline',
    defaultValue: true,
  })
  showGustsOutline!: boolean;

  // Shrink each wind arrow as its reading ages, so fresh stations stand out and
  // stale ones recede (never below half size).
  @trackedInLocalStorage({
    keyName: 'settings.shrinkOldData',
    defaultValue: true,
  })
  shrinkOldData!: boolean;

  // Show the /nearby stations list as dense rows instead of full cards, so
  // more stations fit on screen without scrolling (#64).
  @trackedInLocalStorage({
    keyName: 'settings.nearbyCompactList',
    defaultValue: false,
  })
  nearbyCompactList!: boolean;

  // Show the /favorites stations list as dense rows instead of full cards,
  // mirroring nearbyCompactList.
  @trackedInLocalStorage({
    keyName: 'settings.favoritesCompactList',
    defaultValue: false,
  })
  favoritesCompactList!: boolean;

  // Replace the Now/Last hour cards' text labels with small icons, so each
  // value shrinks to fit its content instead of stretching full width.
  @trackedInLocalStorage({
    keyName: 'settings.useIconLabels',
    defaultValue: false,
  })
  useIconLabels!: boolean;

  // Beta feature: play a one-off full-rotation spin on the refresh button's
  // arrow every time a refresh starts (app/components/navbar/refresh-control.ts),
  // whatever triggers it — a press, the auto-refresh tick, or anything else
  // that calls `refreshNow` — on top of the continuous spin already shown
  // while a request is actually loading. Gives immediate feedback even when
  // the refresh itself is near-instant. Its own toggle defaults on, but —
  // like every beta feature — only takes effect while `betaFeaturesEnabled`
  // is also on, and its settings row only appears once beta features are
  // enabled.
  @trackedInLocalStorage({
    keyName: 'settings.refreshButtonSpin',
    defaultValue: true,
  })
  refreshButtonSpin!: boolean;

  // Beta feature: the favourites view and the favourite heart on a station
  // panel (app/components/navbar/menu/items.ts, app/components/station/header.gts).
  // Its own toggle defaults on (this feature already shipped, gated only by
  // `betaFeaturesEnabled` until now) but — like every beta feature — only
  // takes effect while `betaFeaturesEnabled` is also on.
  @trackedInLocalStorage({
    keyName: 'settings.favoritesFeatureEnabled',
    defaultValue: true,
  })
  favoritesFeatureEnabled!: boolean;

  // Early access to in-development features. Off by default; turning it on
  // reveals each individual beta feature's own toggle below it (see
  // app/templates/settings.gts for the warning shown alongside this toggle).
  @trackedInLocalStorage({
    keyName: 'settings.betaFeaturesEnabled',
    defaultValue: false,
  })
  betaFeaturesEnabled!: boolean;
}

// The boolean preferences, named so the settings UI can drive each one through a
// single generic row (read `settings[key]`, write `settings[key] = value`) and a
// matching `settings.<key>.{label,description}` translation. Keep this union in
// step with the fields above when adding a preference.
export type BooleanSettingKey =
  | 'faviconFollowsStation'
  | 'showGustsOutline'
  | 'shrinkOldData'
  | 'nearbyCompactList'
  | 'favoritesCompactList'
  | 'useIconLabels'
  | 'refreshButtonSpin'
  | 'favoritesFeatureEnabled'
  | 'betaFeaturesEnabled';

declare module '@ember/service' {
  interface Registry {
    settings: SettingsService;
  }
}
