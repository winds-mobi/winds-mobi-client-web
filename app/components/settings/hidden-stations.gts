import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';
import { LinkTo } from '@ember/routing';
import { Request } from '@warp-drive/ember';
import { t } from 'ember-intl';
import { Alert } from 'frontile/status';
import { byIdsQuery } from 'winds-mobi-client-web/builders/station';
import StationHideButton from 'winds-mobi-client-web/components/station/hide-button';
import StationSectionCard from 'winds-mobi-client-web/components/station/section-card';
import type HiddenStationsService from 'winds-mobi-client-web/services/hidden-stations';
import type {
  Station,
  StoreService,
} from 'winds-mobi-client-web/services/store';

export interface SettingsHiddenStationsSignature {
  Element: HTMLElement;
}

// The one place hidden stations are listed outside their own page: hiding is
// rare enough that it has no navbar entry, so Settings names each hidden
// station (with its unhide button) and links on to the Hidden page, which
// shows their live readings.
export default class SettingsHiddenStations extends Component<SettingsHiddenStationsSignature> {
  @service('hidden-stations') declare hiddenStations: HiddenStationsService;
  @service declare store: StoreService;

  get hiddenIds(): string[] {
    return this.hiddenStations.stationIds;
  }

  @cached
  get stationsRequest() {
    return this.store.request<{ data: Station[] }>(
      byIdsQuery<Station>('station', this.hiddenIds)
    );
  }

  <template>
    <StationSectionCard
      data-test-settings-hidden-stations
      @title={{t "settings.hiddenStations.title"}}
      ...attributes
    >
      <div class="flex flex-col gap-3">
        {{#if this.hiddenIds.length}}
          <Request @request={{this.stationsRequest}}>
            <:content as |result|>
              <ul class="flex flex-col divide-y divide-slate-200">
                {{#each result.data as |station|}}
                  <li
                    class="flex items-center justify-between gap-2 py-1.5"
                    data-test-settings-hidden-station={{station.id}}
                  >
                    <span class="min-w-0 truncate text-sm text-slate-950">
                      {{station.name}}
                    </span>
                    <StationHideButton @station={{station}} />
                  </li>
                {{/each}}
              </ul>
            </:content>
            <:loading>
              <Alert @status="neutral" @title={{t "hidden.loading"}} />
            </:loading>
            <:error>
              <Alert @status="danger" @title={{t "hidden.requestError"}} />
            </:error>
          </Request>
        {{else}}
          <p class="text-sm text-slate-500" data-test-settings-hidden-empty>
            {{t "hidden.emptyTitle"}}
          </p>
        {{/if}}

        <LinkTo
          @route="hidden"
          class="self-start text-sm font-semibold text-primary underline"
          data-test-settings-hidden-link
        >
          {{t "settings.hiddenStations.link"}}
        </LinkTo>
      </div>
    </StationSectionCard>
  </template>
}
