import { action } from '@ember/object';
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { rawTimeout, task } from 'ember-concurrency';

const DEFAULT_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const DEFAULT_COUNTDOWN_TICK_MS = 15 * 1000;

export default class MapRefreshService extends Service {
  @tracked lastRefresh?: Date;
  @tracked scheduleStartedAt = new Date();
  @tracked currentTime = this.scheduleStartedAt;

  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS;
  countdownTickMs = DEFAULT_COUNTDOWN_TICK_MS;

  private activeConsumers = 0;

  refreshLoop = task({ restartable: true }, async () => {
    while (this.isActive) {
      const remainingMs = Math.max(
        0,
        this.nextRefreshAt.getTime() - Date.now()
      );
      const sleepMs = Math.min(this.countdownTickMs, remainingMs);

      if (sleepMs > 0) {
        await rawTimeout(sleepMs);
      }

      if (!this.isActive) {
        return;
      }

      this.currentTime = new Date();

      if (this.currentTime >= this.nextRefreshAt) {
        this.noteRefresh();
        this.resetCountdown();
      }
    }
  });

  get nextRefreshAt() {
    return new Date(this.scheduleStartedAt.getTime() + this.refreshIntervalMs);
  }

  get remainingMs() {
    return Math.max(
      0,
      this.nextRefreshAt.getTime() - this.currentTime.getTime()
    );
  }

  get secondsRemaining() {
    return Math.ceil(this.remainingMs / 1000);
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

    this.noteRefresh();
    this.resetSchedule();
    void this.refreshLoop.perform();
  }

  private resetSchedule() {
    this.resetCountdown();
  }

  private resetCountdown() {
    const currentTime = new Date();

    this.scheduleStartedAt = currentTime;
    this.currentTime = currentTime;
  }

  private noteRefresh() {
    this.lastRefresh = new Date();
  }
}

declare module '@ember/service' {
  interface Registry {
    'map-refresh': MapRefreshService;
  }
}
