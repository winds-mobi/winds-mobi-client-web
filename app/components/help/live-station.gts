import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import { Request } from '@warp-drive/ember';
import { t } from 'ember-intl';
import { Alert } from 'frontile/status';
import { findRecord } from 'winds-mobi-client-web/builders/station';
import type {
  Station,
  StoreService,
} from 'winds-mobi-client-web/services/store.js';
import StationAir from 'winds-mobi-client-web/components/station/air';
import StationFavoriteButton from 'winds-mobi-client-web/components/station/favorite-button';
import StationHideButton from 'winds-mobi-client-web/components/station/hide-button';
import StationHeader from 'winds-mobi-client-web/components/station/header';
import StationMeta from 'winds-mobi-client-web/components/station/meta';
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
  @service declare store: StoreService;

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
            <div class="flex min-w-0 items-start justify-between gap-2">
              <StationHeader @station={{result.data}} />
              <div class="flex shrink-0 items-center">
                <StationHideButton @station={{result.data}} />
                <StationFavoriteButton @station={{result.data}} />
              </div>
            </div>
            <StationMeta @station={{result.data}} class="mt-1.5" />
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
        <Alert @status="neutral" @title={{t "help.liveStation.loading"}} />
      </:loading>

      <:error>
        <Alert @status="danger" @title={{t "help.liveStation.requestError"}} />
      </:error>
    </Request>
  </template>
}
