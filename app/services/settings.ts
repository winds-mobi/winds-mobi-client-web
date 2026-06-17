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

  // Fade each wind arrow toward transparent as its reading ages, so fresh
  // stations stand out and stale ones recede (never fully vanishing).
  @trackedInLocalStorage({ keyName: 'settings.fadeOldData' })
  fadeOldData = true;

  // Whether a freshly opened station panel starts with its wind and air graphs
  // synced. The per-panel switch remains the live override for that session.
  @trackedInLocalStorage({ keyName: 'settings.syncGraphsByDefault' })
  syncGraphsByDefault = true;
}

declare module '@ember/service' {
  interface Registry {
    settings: SettingsService;
  }
}
