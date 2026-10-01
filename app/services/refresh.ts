import { action } from '@ember/object';
import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { buildWaiter } from '@ember/test-waiters';
import { rawTimeout, task } from 'ember-concurrency';
import type { StoreService } from 'winds-mobi-client-web/services/store';

const DEFAULT_REFRESH_INTERVAL_MS = 2 * 60 * 1000;
const DEFAULT_COUNTDOWN_TICK_MS = 1 * 1000;

// Every request type a refresh re-fetches (see app/builders/refreshable.ts).
const REFRESHED_TYPES = ['station', 'history'];

// How soon after the last fetch settled a new one still counts as part of the
// same refresh cycle. Covers request waterfalls: a station's history sections
// only start fetching once the station itself has loaded and rendered.
const DEFAULT_CYCLE_GRACE_MS = 1000;

// An open refresh cycle is pending work: `settled()` in tests waits for it to
// close, so the next action starts a cycle of its own.
const cycleWaiter = buildWaiter('refresh:cycle-grace');

// The one refresh countdown behind the navbar's refresh button. A refresh
// never touches a component directly: it invalidates every cached station and
// history request, and each mounted `<Request @autorefresh="invalid">`
// re-fetches its own in place.
export default class RefreshService extends Service {
  @service declare store: StoreService;

  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS;
  countdownTickMs = DEFAULT_COUNTDOWN_TICK_MS;
  cycleGraceMs = DEFAULT_CYCLE_GRACE_MS;

  @tracked lastRefreshAt = new Date();
  @tracked now = this.lastRefreshAt;

  // Bumped once per refresh cycle, whatever started it -- the navbar's
  // one-off spin derives from it.
  @tracked refreshCount = 0;

  // Network fetches in flight, reported by `RefreshTrackingHandler`.
  @tracked private inFlightCount = 0;

  get isRefreshing(): boolean {
    return this.inFlightCount > 0;
  }

  get nextRefreshAt(): Date {
    return new Date(this.lastRefreshAt.getTime() + this.refreshIntervalMs);
  }

  get elapsedMs(): number {
    return Math.max(0, this.now.getTime() - this.lastRefreshAt.getTime());
  }

  // Called by `RefreshTrackingHandler` for every refreshable request that
  // reaches the network (cache hits never do). A fetch that isn't part of a
  // cycle already -- a pan, a station switch, the countdown, the refresh
  // button -- opens one: the countdown restarts and everything else on screen
  // re-fetches alongside it, so all data shown shares one timestamp. Fetches
  // while a cycle is open (including the ones it triggers) join it. Returns
  // the function to call once the fetch settles.
  fetchStarted = (): (() => void) => {
    if (!this.isCycleOpen) {
      this.refreshCount++;
      this.resetCountdown();
      this.invalidateAll();
    }

    this.inFlightCount++;

    return () => {
      this.inFlightCount--;
      void this.cycleGrace.perform();
    };
  };

  private get isCycleOpen(): boolean {
    return this.inFlightCount > 0 || this.cycleGrace.isRunning;
  }

  // Keeps the cycle open for `cycleGraceMs` after the last fetch settles;
  // every settling fetch restarts it.
  private cycleGrace = task({ restartable: true }, async () => {
    const token = cycleWaiter.beginAsync();

    try {
      await rawTimeout(this.cycleGraceMs);
    } finally {
      cycleWaiter.endAsync(token);
    }
  });

  @action
  refreshNow() {
    this.resetCountdown();
    this.invalidateAll();
  }

  // Runs the countdown for as long as the navbar is mounted (see the
  // `activate-refresh` modifier); returns the teardown.
  start(): () => void {
    this.resetCountdown();
    void this.refreshLoop.perform();

    return () => void this.refreshLoop.cancelAll();
  }

  refreshLoop = task(async () => {
    while (true) {
      const remainingMs = this.nextRefreshAt.getTime() - Date.now();

      await rawTimeout(
        Math.max(0, Math.min(this.countdownTickMs, remainingMs))
      );

      this.now = new Date();

      if (this.now >= this.nextRefreshAt) {
        this.refreshNow();
      }
    }
  });

  private invalidateAll() {
    for (const type of REFRESHED_TYPES) {
      this.store.lifetimes.invalidateRequestsForType(type, this.store);
    }
  }

  private resetCountdown() {
    this.lastRefreshAt = new Date();
    this.now = this.lastRefreshAt;
  }
}

declare module '@ember/service' {
  interface Registry {
    refresh: RefreshService;
  }
}
