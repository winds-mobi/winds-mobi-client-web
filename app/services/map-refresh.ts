import { action } from '@ember/object';
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { TrackedSet } from 'tracked-built-ins';
import { rawTimeout, task } from 'ember-concurrency';

const DEFAULT_REFRESH_INTERVAL_MS = 2 * 60 * 1000;
const DEFAULT_COUNTDOWN_TICK_MS = 1 * 1000;

// A request site reports whether it is currently loading.
type LoadingProbe = () => boolean;

export default class MapRefreshService extends Service {
  @tracked lastRefresh?: Date;
  @tracked scheduleStartedAt = new Date();
  @tracked currentTime = this.scheduleStartedAt;

  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS;
  countdownTickMs = DEFAULT_COUNTDOWN_TICK_MS;

  @tracked private activeConsumers = 0;

  // Loading probes registered by request sites (the map, nearby, …). The refresh
  // itself is already broadcast to every site via `lastRefresh`; this lets the
  // navbar refresh control spin while *any* registered request is in flight,
  // without coupling the control to where those requests live. A `TrackedSet` so
  // registering/unregistering a site re-evaluates `isRefreshing` reactively.
  private loadingProbes = new TrackedSet<LoadingProbe>();

  // Returns an unregister function for the modifier's teardown.
  registerLoadingProbe = (probe: LoadingProbe): (() => void) => {
    this.loadingProbes.add(probe);

    return () => {
      this.loadingProbes.delete(probe);
    };
  };

  // True while any registered request reports itself in flight. Reading each probe
  // consumes that site's tracked request state, so this re-evaluates whenever any
  // site starts or finishes loading.
  get isRefreshing(): boolean {
    return [...this.loadingProbes].some((probe) => probe());
  }

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

  get lastRefreshAt() {
    return this.lastRefresh ?? this.scheduleStartedAt;
  }

  get remainingMs() {
    return Math.max(
      0,
      this.nextRefreshAt.getTime() - this.currentTime.getTime()
    );
  }

  get elapsedMs() {
    return Math.max(
      0,
      this.currentTime.getTime() - this.lastRefreshAt.getTime()
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

    this.resetCountdown();
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
    this.resetCountdown();
    void this.refreshLoop.perform();
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
