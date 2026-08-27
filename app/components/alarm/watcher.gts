import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { alarmsQuery } from 'winds-mobi-client-web/builders/station';
import commitResolvedStations from 'winds-mobi-client-web/modifiers/commit-resolved-stations';
import { stationTriggersAlarm } from 'winds-mobi-client-web/utils/alarm-matching';
import { playAlarmSound } from 'winds-mobi-client-web/utils/alarm-sound';
import type AlarmsService from 'winds-mobi-client-web/services/alarms';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';
import type {
  Station,
  StoreService,
} from 'winds-mobi-client-web/services/store';

export interface AlarmWatcherSignature {
  Element: HTMLDivElement;
}

// Always-on alarm evaluator, mounted once at the app root
// (app/templates/application.gts) so it runs regardless of the active
// route. Renders nothing visible; its only job is to fetch exactly the
// alarmed stations on each shared refresh tick and update
// alarmsService.triggeredStationIds — which the bell icon
// (station/header.gts), the alarms list row (alarm/row.gts), and the map
// marker ring (modifiers/select-map-marker.ts) all read reactively. No need
// to activate map-refresh itself: Navbar already keeps it running
// unconditionally (app/components/navbar/index.gts), and Navbar is always
// mounted (app/templates/application.gts).
export default class AlarmWatcher extends Component<AlarmWatcherSignature> {
  @service declare alarms: AlarmsService;
  @service declare mapRefresh: MapRefreshService;
  @service declare store: StoreService;

  get alarmedStationIds(): string[] {
    return Object.keys(this.alarms.configs);
  }

  @cached
  get stationsRequest(): Future<{ data: Station[] }> | undefined {
    const ids = this.alarmedStationIds;

    if (ids.length === 0) {
      return undefined;
    }

    // Read so each refresh tick invalidates this getter and refetches.
    void this.mapRefresh.lastRefresh;

    return this.store.request<{ data: Station[] }>(
      alarmsQuery<Station>('station', ids)
    );
  }

  get requestState() {
    return this.stationsRequest
      ? getRequestState(this.stationsRequest)
      : undefined;
  }

  // Shadow copy of the previous tick's triggered set, kept outside Ember's
  // tracking on purpose: `station/header.gts` and others already read the
  // tracked `alarms.triggeredStationIds` during the same render this
  // modifier's update runs in, so reading it back here too (to edge-detect)
  // before writing it below would be a read-then-write-in-the-same-
  // computation, which Ember's backtracking-write assertion forbids. Same
  // "pure write, no read" shape as map-refresh.ts's `consumers` set.
  #previouslyTriggered = new Set<string>();

  evaluateStations = (stations: Station[]) => {
    const triggered = new Set<string>();

    for (const station of stations) {
      const config = this.alarms.configs[station.id];

      if (config && stationTriggersAlarm(station, config)) {
        triggered.add(station.id);
      }
    }

    // Edge-detect: only newly-triggered stations play the sound, so it
    // doesn't replay every refresh tick while a station stays above
    // threshold.
    const isNewlyTriggered = [...triggered].some(
      (id) => !this.#previouslyTriggered.has(id)
    );

    this.#previouslyTriggered = triggered;
    this.alarms.triggeredStationIds = triggered;

    if (isNewlyTriggered) {
      playAlarmSound();
    }
  };

  <template>
    <div
      hidden
      data-test-alarm-watcher
      {{commitResolvedStations this.requestState this.evaluateStations}}
    ></div>
  </template>
}
