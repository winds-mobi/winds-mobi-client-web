import Service from '@ember/service';
import { trackedInLocalStorage } from 'winds-mobi-client-web/utils/tracked-local-storage';

// User-facing display preferences, persisted in the browser so they survive
// reloads and stay device-local. Each property is reactive (tracked) and
// mirrored to localStorage by `trackedInLocalStorage`; consumers read
// `settings.<name>` directly and re-render when it changes. The stored value
// is omitted while it equals `defaultValue`, so defaults can evolve later.
export default class SettingsService extends Service {
  // Render the selected station's wind arrow as the browser-tab favicon.
  @trackedInLocalStorage({ keyName: 'settings.faviconFollowsStation' })
  faviconFollowsStation = true;

  // Draw the gusts-coloured outline around wind arrows on the map.
  @trackedInLocalStorage({ keyName: 'settings.showGustsOutline' })
  showGustsOutline = true;

  // Shrink each wind arrow as its reading ages, so fresh stations stand out and
  // stale ones recede (never below half size).
  @trackedInLocalStorage({ keyName: 'settings.shrinkOldData' })
  shrinkOldData = true;

  // Show the /nearby stations list as dense rows instead of full cards, so
  // more stations fit on screen without scrolling (#64).
  @trackedInLocalStorage({ keyName: 'settings.nearbyCompactList' })
  nearbyCompactList = false;
}

// The boolean preferences, named so the settings UI can drive each one through a
// single generic row (read `settings[key]`, write `settings[key] = value`) and a
// matching `settings.<key>.{label,description}` translation. Keep this union in
// step with the fields above when adding a preference.
export type BooleanSettingKey =
  | 'faviconFollowsStation'
  | 'showGustsOutline'
  | 'shrinkOldData'
  | 'nearbyCompactList';

declare module '@ember/service' {
  interface Registry {
    settings: SettingsService;
  }
}
