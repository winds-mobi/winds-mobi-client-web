import Component from '@glimmer/component';
import { formatRelative } from 'ember-intl';

const THRESHOLDS = [
  { limit: 60, unit: 'second' },
  { limit: 3600, unit: 'minute' },
  { limit: 86400, unit: 'hour' },
  { limit: 604800, unit: 'day' },
  { limit: 2629800, unit: 'week' },
  { limit: 31557600, unit: 'month' },
  { limit: Infinity, unit: 'year' },
];

function autoRelativeTimeFormat(seconds: number) {
  const absSeconds = Math.abs(seconds);

  for (const { limit, unit } of THRESHOLDS) {
    if (absSeconds < limit) {
      const value =
        unit === 'second' ? seconds : Math.round(seconds / (limit / 60));
      return { value, unit };
    }
  }

  return { value: seconds, unit: 'seconds' };
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
    return autoRelativeTimeFormat(
      this.args.timestamp - Math.round(Date.now() / 1000),
    );
  }

  <template>
    {{formatRelative this.relativeTime.value unit=this.relativeTime.unit}}
  </template>
}
