import Helper from '@ember/component/helper';
import { service } from '@ember/service';
import type IntlService from 'ember-intl/services/intl';

type TimeAgoUnit = {
  limit: number;
  unit: Intl.RelativeTimeFormatUnit;
  divisor: number;
};

const TIME_AGO_UNITS: TimeAgoUnit[] = [
  { limit: 60, unit: 'second', divisor: 1 },
  { limit: 3600, unit: 'minute', divisor: 60 },
  { limit: 86400, unit: 'hour', divisor: 3600 },
  { limit: 604800, unit: 'day', divisor: 86400 },
  { limit: 2629800, unit: 'week', divisor: 604800 },
  { limit: 31557600, unit: 'month', divisor: 2629800 },
  { limit: Infinity, unit: 'year', divisor: 31557600 },
];

export function relativeSecondsFromTimestamp(ms: number): number {
  return Math.round(ms / 1000 - Date.now() / 1000);
}

export function timeAgoParts(seconds: number) {
  const absSeconds = Math.abs(seconds);

  for (const { limit, unit, divisor } of TIME_AGO_UNITS) {
    if (absSeconds < limit) {
      return {
        value: Math.round(seconds / divisor),
        unit,
      };
    }
  }

  return {
    value: Math.round(seconds),
    unit: 'second' as const,
  };
}

export function renderTimeAgoText(intl: IntlService, seconds: number) {
  const { value, unit } = timeAgoParts(seconds);

  return intl.formatRelativeTime(value, { unit, style: 'narrow' });
}

const COMPACT_UNIT_SUFFIXES: Partial<
  Record<Intl.RelativeTimeFormatUnit, string>
> = {
  second: 's',
  minute: 'm',
  hour: 'h',
  day: 'd',
  week: 'w',
  month: 'mo',
  year: 'y',
};

// A terse "5m" reading with no "ago"/unit-word, for tight spaces (e.g. the
// compact nearby/favourites cards) where renderTimeAgoText's full wording
// doesn't fit. Shares timeAgoParts with the narrow-style helper above so the
// two never disagree on which unit a given age falls into.
export function compactTimeAgo(seconds: number): string {
  const { value, unit } = timeAgoParts(seconds);

  return `${Math.abs(value)}${COMPACT_UNIT_SUFFIXES[unit] ?? ''}`;
}

interface TimeAgoSignature {
  Args: {
    Positional: [number];
  };
  Return: string;
}

export default class TimeAgoHelper extends Helper<TimeAgoSignature> {
  @service declare intl: IntlService;

  compute([seconds]: TimeAgoSignature['Args']['Positional']) {
    return renderTimeAgoText(this.intl, seconds);
  }
}
