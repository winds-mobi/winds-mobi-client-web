import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { trackedInLocalStorage } from 'ember-tracked-local-storage';

// One alarm config per station. `directionBands` is indexed exactly like
// `DIRECTIONS` in app/helpers/azimuth-to-cardinal.ts (N, NE, E, SE, S, SW, W,
// NW): each entry is an index into WIND_COLOUR_BANDS
// (app/helpers/wind-to-colour.ts, 0-9) marking the armed threshold for that
// direction, or `null` if the direction is unarmed. The alarm fires for a
// direction once the reading's band index is >= the armed index.
export interface AlarmConfig {
  stationId: string;
  directionBands: (number | null)[];
  metric: 'wind' | 'gusts';
  createdAt: number;
}

// Alarm configs, persisted directly in the browser via
// ember-tracked-local-storage (same pattern as app/services/favorites.ts).
// No account/profile backs this list — sign-in is currently disabled (see
// app/services/session.ts), so alarms are device-local.
export default class AlarmsService extends Service {
  @trackedInLocalStorage({
    keyName: 'alarms.configs',
    defaultValue: {},
  })
  configs!: Record<string, AlarmConfig>;

  // Stations whose latest known reading currently exceeds their armed
  // threshold, written by the alarm-evaluation watcher
  // (app/components/alarm/watcher.gts) on every resolved refresh.
  @tracked triggeredStationIds: Set<string> = new Set();

  has(stationId: string): boolean {
    return stationId in this.configs;
  }

  get(stationId: string): AlarmConfig | undefined {
    return this.configs[stationId];
  }

  save(config: AlarmConfig): void {
    this.configs = { ...this.configs, [config.stationId]: config };
  }

  delete(stationId: string): void {
    const rest = { ...this.configs };
    delete rest[stationId];
    this.configs = rest;
  }
}

declare module '@ember/service' {
  interface Registry {
    alarms: AlarmsService;
  }
}
