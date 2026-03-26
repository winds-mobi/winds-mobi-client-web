import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import { Request } from '@warp-drive/ember';
import { findRecord } from 'winds-mobi-client-web/builders/station';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import StationAir from 'winds-mobi-client-web/components/station/air';
import StationHeader from 'winds-mobi-client-web/components/station/header';
import StationSummary from 'winds-mobi-client-web/components/station/summary';
import StationWind from 'winds-mobi-client-web/components/station/wind';

export interface HelpLiveStationSignature {
  Args: {
    stationId: string;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class HelpLiveStation extends Component<HelpLiveStationSignature> {
  @service
  declare store: typeof import('winds-mobi-client-web/services/store').default;

  @cached
  get stationRequest() {
    return this.store.request<{ data: Station }>(
      findRecord<Station>('station', this.args.stationId)
    );
  }

  <template>
    <Request @request={{this.stationRequest}}>
      <:content as |result|>
        <div class="grid gap-4">
          <div
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <StationHeader @station={{result.data}} />
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-100 p-3">
            <div class="grid gap-4">
              <StationSummary @station={{result.data}} />
              <StationWind @stationId={{result.data.id}} />
              <StationAir @stationId={{result.data.id}} />
            </div>
          </div>
        </div>
      </:content>

      <:loading>
        <div
          class="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm"
        >
          Loading live station example…
        </div>
      </:loading>

      <:error>
        <div
          class="rounded-xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-sm"
        >
          The live station example could not be loaded right now.
        </div>
      </:error>
    </Request>
  </template>
}
