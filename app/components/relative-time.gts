import Component from '@glimmer/component';
import { service } from '@ember/service';
import type IntlService from 'ember-intl/services/intl';

function normalizeTimestamp(timestamp: number) {
  // The station payload may contain epoch seconds while other datasets use
  // epoch milliseconds. Normalize both so formatting stays stable.
  if (timestamp > 1_000_000_000_000) {
    return timestamp / 1000;
  }

  return timestamp;
}

function relativeSecondsFromTimestamp(timestamp: number) {
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return Math.round(normalizeTimestamp(timestamp) - Date.now() / 1000);
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
  @service declare intl: IntlService;

  get formattedRelativeTime() {
    const relativeSeconds = relativeSecondsFromTimestamp(this.args.timestamp);

    if (relativeSeconds === null) {
      return null;
    }

    return this.intl.formatRelativeTime(relativeSeconds, { unit: 'second' });
  }

  <template>
    {{#if this.formattedRelativeTime}}
      {{this.formattedRelativeTime}}
    {{else}}
      -
    {{/if}}
  </template>
}
