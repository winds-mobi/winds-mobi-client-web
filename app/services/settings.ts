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

  // Replace the Now/Last hour cards' text labels with small icons, so each
  // value shrinks to fit its content instead of stretching full width.
  @trackedInLocalStorage({
    keyName: 'settings.useIconLabels',
    defaultValue: false,
  })
  useIconLabels!: boolean;

  // Wind direction arrows on the wind history chart
  // (app/components/station/wind/presenter.gts).
  @trackedInLocalStorage({
    keyName: 'settings.windDirectionHistoryEnabled',
    defaultValue: false,
  })
  windDirectionHistoryEnabled!: boolean;

  // Beta feature: hiding a station (app/components/station/hide-button.gts)
  // removes it from All stations, map and cards (#167), so a less useful
  // station overlapping a better one doesn't have to be seen at all. Hidden
  // stations are listed at the bottom of Settings and on the Hidden page
  // (app/templates/hidden.gts). Defaults off, so opting in takes two
  // deliberate steps (betaFeaturesEnabled, then this).
  @trackedInLocalStorage({
    keyName: 'settings.hiddenStationsFeatureEnabled',
    defaultValue: false,
  })
  hiddenStationsFeatureEnabled!: boolean;

  // Early access to in-development features. Off by default; turning it on
  // reveals each individual beta feature's own toggle below it (see
  // app/templates/settings.gts for the warning shown alongside this toggle).
  @trackedInLocalStorage({
    keyName: 'settings.betaFeaturesEnabled',
    defaultValue: false,
  })
  betaFeaturesEnabled!: boolean;

  // A beta feature is on only while beta features are enabled *and* its own
  // toggle is: turning beta off switches every beta feature off with it
  // (hidden stations then show again), whatever its own toggle still holds.
  betaFeatureOn(feature: BetaFeatureKey): boolean {
    return this.betaFeaturesEnabled && this[feature];
  }
}

// Every feature currently in beta, by its own toggle. Settings shows each one's
// row while this lists any, and a "nothing in beta" note once it's empty --
// keep it in step with the beta rows in app/templates/settings.gts.
export const BETA_FEATURE_KEYS = ['hiddenStationsFeatureEnabled'] as const;

export type BetaFeatureKey = (typeof BETA_FEATURE_KEYS)[number];

// The boolean preferences, named so the settings UI can drive each one through a
// single generic row (read `settings[key]`, write `settings[key] = value`) and a
// matching `settings.<key>.{label,description}` translation. Keep this union in
// step with the fields above when adding a preference.
export type BooleanSettingKey =
  | 'faviconFollowsStation'
  | 'showGustsOutline'
  | 'shrinkOldData'
  | 'useIconLabels'
  | 'windDirectionHistoryEnabled'
  | 'hiddenStationsFeatureEnabled'
  | 'betaFeaturesEnabled';

declare module '@ember/service' {
  interface Registry {
    settings: SettingsService;
  }
}
