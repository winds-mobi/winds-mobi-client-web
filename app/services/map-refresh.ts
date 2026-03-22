import { registerDestructor } from '@ember/destroyable';
import { action } from '@ember/object';
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

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
  private countdownTimerId?: ReturnType<typeof globalThis.setInterval>;
  private refreshTimerId?: ReturnType<typeof globalThis.setTimeout>;

  constructor(owner: unknown, args: object) {
    super(owner, args);

    registerDestructor(this, () => {
      this.stopTimers();
    });
  }

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
    this.startCountdown();
  }

  deactivate() {
    if (this.activeConsumers === 0) {
      return;
    }

    this.activeConsumers--;

    if (this.activeConsumers > 0) {
      return;
    }

    this.stopTimers();
    this.resetCountdown();
  }

  @action
  refreshNow() {
    if (!this.isActive) {
      return;
    }

    this.refreshRevision++;
    this.resetSchedule();
  }

  private startCountdown() {
    this.clearCountdownTimer();
    this.countdownTimerId = globalThis.setInterval(() => {
      this.now = Date.now();
    }, this.countdownTickMs);
  }

  private scheduleAutoRefresh() {
    this.clearRefreshTimer();
    this.refreshTimerId = globalThis.setTimeout(() => {
      if (!this.isActive) {
        return;
      }

      this.refreshRevision++;
      this.resetSchedule();
    }, this.refreshIntervalMs);
  }

  private resetSchedule() {
    this.resetCountdown();
    this.scheduleAutoRefresh();
  }

  private resetCountdown() {
    const currentTimestamp = Date.now();

    this.now = currentTimestamp;
    this.nextRefreshAt = currentTimestamp + this.refreshIntervalMs;
  }

  private stopTimers() {
    this.clearCountdownTimer();
    this.clearRefreshTimer();
  }

  private clearCountdownTimer() {
    if (this.countdownTimerId) {
      globalThis.clearInterval(this.countdownTimerId);
      this.countdownTimerId = undefined;
    }
  }

  private clearRefreshTimer() {
    if (this.refreshTimerId) {
      globalThis.clearTimeout(this.refreshTimerId);
      this.refreshTimerId = undefined;
    }
  }
}

declare module '@ember/service' {
  interface Registry {
    'map-refresh': MapRefreshService;
  }
}
