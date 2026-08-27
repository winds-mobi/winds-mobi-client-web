import Component from '@glimmer/component';
import { service } from '@ember/service';
import StationHeader from './header';
import StationMeta from './meta';
import StationSummary from './summary';
import { ALARM_GLOW_CLASS } from 'winds-mobi-client-web/utils/alarm-color';
import type AlarmsService from 'winds-mobi-client-web/services/alarms';
import type { Station } from 'winds-mobi-client-web/services/store.js';

export interface StationNearbyCardSignature {
  Args: {
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationNearbyCard extends Component<StationNearbyCardSignature> {
  @service declare alarms: AlarmsService;

  get isAlarmTriggered(): boolean {
    return this.alarms.triggeredStationIds.has(this.args.station.id);
  }

  <template>
    <article
      data-test-nearby-station-card
      data-test-alarm-glow={{if this.isAlarmTriggered "true"}}
      class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-900/12 sm:p-5
        {{if this.isAlarmTriggered ALARM_GLOW_CLASS}}"
    >
      <div class="mb-4">
        <StationHeader @station={{@station}} />
        <StationMeta @station={{@station}} class="mt-1.5" />
      </div>

      <StationSummary @station={{@station}} />
    </article>
  </template>
}
