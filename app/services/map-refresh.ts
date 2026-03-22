import { registerDestructor } from '@ember/destroyable';
import { action } from '@ember/object';
import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type RouterService from '@ember/routing/router-service';
import { isMapRoute } from 'winds-mobi-client-web/utils/map-view';

const DEFAULT_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const DEFAULT_COUNTDOWN_TICK_MS = 1000;

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default class MapRefreshService extends Service {
  @service declare router: RouterService;

  @tracked isActive = false;
  @tracked refreshRevision = 0;
  @tracked now = Date.now();
  @tracked nextRefreshAt = this.now + DEFAULT_REFRESH_INTERVAL_MS;

  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS;
  countdownTickMs = DEFAULT_COUNTDOWN_TICK_MS;

  private countdownTimerId?: ReturnType<typeof globalThis.setInterval>;
  private refreshTimerId?: ReturnType<typeof globalThis.setTimeout>;
  private routeEventSource?: EventedRouterService;

  constructor(owner: unknown, args: object) {
    super(owner, args);

    this.routeEventSource = this.router as EventedRouterService;
    this.routeEventSource.on('routeDidChange', this.handleRouteDidChange);
    this.syncWithCurrentRoute();

    registerDestructor(this, () => {
      this.stopTimers();
      this.routeEventSource?.off('routeDidChange', this.handleRouteDidChange);
      this.routeEventSource = undefined;
    });
  }

  get secondsRemaining() {
    if (!this.isActive) {
      return 0;
    }

    return Math.max(0, Math.ceil((this.nextRefreshAt - this.now) / 1000));
  }

  get countdownLabel() {
    return formatCountdown(this.secondsRemaining);
  }

  activate() {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.resetSchedule();
    this.startCountdown();
  }

  deactivate() {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.stopTimers();
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
    const currentTimestamp = Date.now();

    this.now = currentTimestamp;
    this.nextRefreshAt = currentTimestamp + this.refreshIntervalMs;
    this.scheduleAutoRefresh();
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

  private handleRouteDidChange = () => {
    this.syncWithCurrentRoute();
  };

  private syncWithCurrentRoute() {
    if (isMapRoute(this.router.currentRouteName)) {
      this.activate();
      return;
    }

    this.deactivate();
  }
}

type RouteDidChangeHandler = () => void;

type EventedRouterService = RouterService & {
  on(event: 'routeDidChange', handler: RouteDidChangeHandler): void;
  off(event: 'routeDidChange', handler: RouteDidChangeHandler): void;
};

declare module '@ember/service' {
  interface Registry {
    'map-refresh': MapRefreshService;
  }
}
