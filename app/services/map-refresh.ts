import { action } from '@ember/object';
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { rawTimeout, task } from 'ember-concurrency';

const DEFAULT_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const DEFAULT_COUNTDOWN_TICK_MS = 15 * 1000;

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default class MapRefreshService extends Service {
  @tracked refreshRevision = 0;
  @tracked now = Date.now();
  @tracked nextRefreshAt = this.now + DEFAULT_REFRESH_INTERVAL_MS;

  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS;
  countdownTickMs = DEFAULT_COUNTDOWN_TICK_MS;

  private activeConsumers = 0;

  refreshLoop = task({ restartable: true }, async () => {
    while (this.isActive) {
      const remainingMs = Math.max(0, this.nextRefreshAt - Date.now());
      const sleepMs = Math.min(this.countdownTickMs, remainingMs);

      if (sleepMs > 0) {
        await rawTimeout(sleepMs);
      }

      if (!this.isActive) {
        return;
      }

      this.now = Date.now();

      if (this.now >= this.nextRefreshAt) {
        this.refreshRevision++;
        this.resetCountdown();
      }
    }
  });

  get secondsRemaining() {
    return Math.max(0, Math.ceil((this.nextRefreshAt - this.now) / 1000));
  }

  get countdownLabel() {
    return formatCountdown(this.secondsRemaining);
  }

  get isActive() {
    return this.activeConsumers > 0;
  }

  activate() {
    this.activeConsumers++;

    if (this.activeConsumers > 1) {
      return;
    }

    this.resetSchedule();
    void this.refreshLoop.perform();
  }

  deactivate() {
    if (this.activeConsumers === 0) {
      return;
    }

    this.activeConsumers--;

    if (this.activeConsumers > 0) {
      return;
    }

    void this.refreshLoop.cancelAll();
    this.resetCountdown();
  }

  @action
  refreshNow() {
    if (!this.isActive) {
      return;
    }

    this.refreshRevision++;
    this.resetSchedule();
    void this.refreshLoop.perform();
  }

  private resetSchedule() {
    this.resetCountdown();
  }

  private resetCountdown() {
    const currentTimestamp = Date.now();

    this.now = currentTimestamp;
    this.nextRefreshAt = currentTimestamp + this.refreshIntervalMs;
  }
}

declare module '@ember/service' {
  interface Registry {
    'map-refresh': MapRefreshService;
  }
}
