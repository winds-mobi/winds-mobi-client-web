import Component from '@glimmer/component';
import { formatRelativeTime } from 'ember-intl';

type RelativeTimeUnit = Intl.RelativeTimeFormatUnit;

const THRESHOLDS: Array<{
  limit: number;
  unit: RelativeTimeUnit;
  divisor: number;
}> = [
  { limit: 60, unit: 'second', divisor: 1 },
  { limit: 3600, unit: 'minute', divisor: 60 },
  { limit: 86400, unit: 'hour', divisor: 3600 },
  { limit: 604800, unit: 'day', divisor: 86400 },
  { limit: 2629800, unit: 'week', divisor: 604800 },
  { limit: 31557600, unit: 'month', divisor: 2629800 },
  { limit: Infinity, unit: 'year', divisor: 31557600 },
];

function normalizeTimestamp(timestamp: number) {
  // The station payload may contain epoch seconds while other datasets use
  // epoch milliseconds. Normalize both so formatting stays stable.
  if (timestamp > 1_000_000_000_000) {
    return timestamp / 1000;
  }

  return timestamp;
}

function autoRelativeTimeFormat(timestamp: number) {
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  const seconds = Math.round(normalizeTimestamp(timestamp) - Date.now() / 1000);
  const absSeconds = Math.abs(seconds);

  for (const { limit, unit, divisor } of THRESHOLDS) {
    if (absSeconds < limit) {
      return {
        value: Math.round(seconds / divisor),
        unit,
      };
    }
  }

  return null;
}

export interface RelativeTimeSignature {
  Args: {
    timestamp: number;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class RelativeTime extends Component<RelativeTimeSignature> {
  get relativeTime() {
    return autoRelativeTimeFormat(this.args.timestamp);
  }

  <template>
    {{#if this.relativeTime}}
      {{formatRelativeTime this.relativeTime.value unit=this.relativeTime.unit}}
    {{else}}
      -
    {{/if}}
  </template>
}
