import Component from '@glimmer/component';
import { t } from 'ember-intl';
import ClockCounterClockwise from 'ember-phosphor-icons/components/ph-clock-counter-clockwise';
import timeAgo, {
  compactTimeAgo,
  relativeSecondsFromTimestamp,
} from 'winds-mobi-client-web/helpers/time-ago';
import { textClassForReadingAge } from 'winds-mobi-client-web/utils/reading-freshness';
import StationMetaItem from './meta-item';

export interface StationUpdatedMetaSignature {
  Args: {
    timestamp: number;
    // Terse "5m" reading with no icon and no "ago" wording, for the tighter
    // meta row on compact nearby/favourites cards. Defaults to the full
    // "5m ago" reading with its clock icon (station header, full cards).
    isCompact?: boolean;
  };
  Element: HTMLDivElement;
}

export default class StationUpdatedMeta extends Component<StationUpdatedMetaSignature> {
  get icon() {
    return this.args.isCompact ? undefined : ClockCounterClockwise;
  }

  // Compact mode's smaller, muted sizing lives here rather than as a `class`
  // callers pass alongside `@isCompact` -- the two would otherwise have to be
  // kept in sync by hand at every call site.
  get sizeClass() {
    return this.args.isCompact ? 'text-[11px] text-slate-500' : undefined;
  }

  get relativeSeconds() {
    return relativeSecondsFromTimestamp(this.args.timestamp);
  }

  <template>
    <StationMetaItem
      @icon={{this.icon}}
      @label={{t "station.meta.updated"}}
      class={{this.sizeClass}}
      ...attributes
    >
      <span class={{textClassForReadingAge @timestamp}}>
        {{if
          @isCompact
          (compactTimeAgo this.relativeSeconds)
          (timeAgo this.relativeSeconds)
        }}
      </span>
    </StationMetaItem>
  </template>
}
