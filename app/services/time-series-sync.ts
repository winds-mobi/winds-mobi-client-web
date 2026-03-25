import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export interface SyncRange {
  min: number;
  max: number;
}

export interface SyncAxis {
  chart: SyncChart;
  getExtremes(): {
    min: number;
    max: number;
  };
  setExtremes(
    min: number,
    max: number,
    redraw?: boolean,
    animation?: boolean,
    eventArguments?: {
      trigger?: string;
    }
  ): void;
}

export interface SyncChart {
  redraw(): void;
  xAxis: SyncAxis[];
}

const SYNC_TRIGGER = 'time-series-sync';

export default class TimeSeriesSyncService extends Service {
  @tracked isSyncEnabled = true;

  private charts = new Set<SyncChart>();
  private currentRange?: SyncRange;

  registerChart(chart: SyncChart) {
    this.charts.add(chart);

    if (this.isSyncEnabled && this.currentRange) {
      this.applyRange(chart, this.currentRange);
    }
  }

  unregisterChart(chart: SyncChart) {
    this.charts.delete(chart);
  }

  syncRange(
    sourceChart: SyncChart,
    min: number,
    max: number,
    trigger?: string
  ) {
    if (!trigger || trigger === SYNC_TRIGGER) {
      return;
    }

    this.currentRange = { min, max };

    if (!this.isSyncEnabled) {
      return;
    }

    for (const chart of this.charts) {
      if (chart === sourceChart) {
        continue;
      }

      this.applyRange(chart, this.currentRange);
    }
  }

  setSyncEnabled(isSyncEnabled: boolean) {
    this.isSyncEnabled = isSyncEnabled;

    if (!isSyncEnabled || !this.currentRange) {
      return;
    }

    for (const chart of this.charts) {
      this.applyRange(chart, this.currentRange);
    }
  }

  private applyRange(chart: SyncChart, range: SyncRange) {
    const axis = chart.xAxis[0];
    const { min, max } = axis.getExtremes();

    if (min === range.min && max === range.max) {
      return;
    }

    axis.setExtremes(range.min, range.max, false, false, {
      trigger: SYNC_TRIGGER,
    });
    chart.redraw();
  }
}

declare module '@ember/service' {
  interface Registry {
    'time-series-sync': TimeSeriesSyncService;
  }
}
