import Component from '@glimmer/component';
import { action } from '@ember/object';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { tracked, cached } from '@glimmer/tracking';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { rawTimeout, task } from 'ember-concurrency';
import { Input as FrontileInput } from '@frontile/forms';
import { Popover } from '@frontile/overlays';
import type { IntlService } from 'ember-intl';
import { t } from 'ember-intl';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { searchQuery } from 'winds-mobi-client-web/builders/station';
import { distanceKm } from 'winds-mobi-client-web/utils/distance';
import { serializeMapView } from 'winds-mobi-client-web/utils/map-view';
import { windBandForSpeed } from 'winds-mobi-client-web/helpers/wind-to-colour';

export interface NavbarSearchSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: HTMLDivElement;
}

type RequestResponse<T> = { data: T } | { content: { data: T } };

type SearchResultItem = {
  buttonClass: string;
  distanceLabel?: string;
  index: number;
  isActive: boolean;
  station: Station;
  windDotClass: string;
  windSpeedLabel: string;
  windTextClass: string;
};

const MIN_SEARCH_LENGTH = 2;
const SEARCH_RESULT_ZOOM = 10;

function responseData<T>(response: RequestResponse<T>): T {
  return 'data' in response ? response.data : response.content.data;
}

export default class NavbarSearch extends Component<NavbarSearchSignature> {
  @service declare intl: IntlService;
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;
  @service declare router: RouterService;
  @service
  declare store: typeof import('winds-mobi-client-web/services/store').default;

  @tracked activeResultIndex = 0;
  @tracked debouncedQuery = '';
  @tracked isOpen = false;
  @tracked query = '';

  updateDebouncedQuery = task({ restartable: true }, async (value: string) => {
    const trimmedValue = value.trim();

    this.debouncedQuery = '';

    if (trimmedValue.length < MIN_SEARCH_LENGTH) {
      return;
    }

    await rawTimeout(200);

    this.debouncedQuery = trimmedValue;
  });

  @cached
  get request(): Future<RequestResponse<Station[]>> | undefined {
    if (this.debouncedQuery.length < MIN_SEARCH_LENGTH) {
      return undefined;
    }

    return this.store.request<RequestResponse<Station[]>>(
      searchQuery<Station>('station', this.debouncedQuery)
    );
  }

  get requestState() {
    return this.request ? getRequestState(this.request) : undefined;
  }

  get results() {
    return this.requestState?.isSuccess
      ? responseData(this.requestState.value)
      : [];
  }

  get clampedActiveResultIndex() {
    if (this.results.length === 0) {
      return -1;
    }

    return Math.min(this.activeResultIndex, this.results.length - 1);
  }

  get activeStation() {
    if (this.clampedActiveResultIndex < 0) {
      return undefined;
    }

    return this.results[this.clampedActiveResultIndex];
  }

  get isLoading() {
    return (
      this.hasEnoughCharacters &&
      (this.updateDebouncedQuery.isRunning ||
        this.requestState?.isPending === true)
    );
  }

  get hasEnoughCharacters() {
    return this.query.trim().length >= MIN_SEARCH_LENGTH;
  }

  get hasNoResults() {
    return (
      this.debouncedQuery.length >= MIN_SEARCH_LENGTH &&
      this.requestState?.isSuccess === true &&
      this.results.length === 0
    );
  }

  get isPopoverOpen() {
    return this.isOpen && this.hasEnoughCharacters;
  }

  get resultItems(): SearchResultItem[] {
    return this.results.map((station, index) => {
      const windBand = windBandForSpeed(station.last.speed);

      return {
        buttonClass: [
          'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition',
          index === this.clampedActiveResultIndex
            ? 'bg-slate-100 text-slate-950'
            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950',
        ].join(' '),
        distanceLabel: this.formatDistanceKm(station),
        index,
        isActive: index === this.clampedActiveResultIndex,
        station,
        windDotClass: windBand.backgroundClass,
        windSpeedLabel: this.formatWindSpeed(station),
        windTextClass: windBand.textClass,
      };
    });
  }

  private formatDistanceKm(station: Station) {
    const coordinates = this.nearbyLocation.coordinates;

    if (!coordinates) {
      return undefined;
    }

    const distance = distanceKm(
      coordinates.latitude,
      coordinates.longitude,
      station.latitude,
      station.longitude
    );

    return `${this.intl.formatNumber(distance, {
      maximumFractionDigits: distance < 10 ? 1 : 0,
    })} km`;
  }

  private formatWindSpeed(station: Station) {
    return `${this.intl.formatNumber(station.last.speed, {
      maximumFractionDigits: station.last.speed < 10 ? 1 : 0,
    })} km/h`;
  }

  private resetSearch() {
    this.query = '';
    this.debouncedQuery = '';
    this.activeResultIndex = 0;
    this.isOpen = false;
    void this.updateDebouncedQuery.cancelAll();
  }

  private targetQueryParams(station: Station) {
    return serializeMapView({
      latitude: station.latitude,
      longitude: station.longitude,
      zoom: SEARCH_RESULT_ZOOM,
    });
  }

  @action
  handleInput(value: string) {
    this.query = value;
    this.activeResultIndex = 0;
    this.isOpen = value.trim().length >= MIN_SEARCH_LENGTH;

    void this.updateDebouncedQuery.perform(value);
  }

  @action
  handleFocus() {
    if (this.hasEnoughCharacters) {
      this.isOpen = true;
    }
  }

  @action
  handleOpenChange(isOpen: boolean) {
    this.isOpen = isOpen && this.hasEnoughCharacters;
  }

  @action
  activateResult(index: number) {
    this.activeResultIndex = index;
  }

  @action
  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.isOpen = false;
      return;
    }

    if (!this.isPopoverOpen) {
      return;
    }

    if (event.key === 'ArrowDown') {
      if (this.results.length === 0) {
        return;
      }

      event.preventDefault();
      this.activeResultIndex =
        this.activeResultIndex >= this.results.length - 1
          ? 0
          : this.activeResultIndex + 1;
      return;
    }

    if (event.key === 'ArrowUp') {
      if (this.results.length === 0) {
        return;
      }

      event.preventDefault();
      this.activeResultIndex =
        this.activeResultIndex <= 0
          ? this.results.length - 1
          : this.activeResultIndex - 1;
      return;
    }

    if (event.key === 'Enter' && this.activeStation) {
      event.preventDefault();
      this.selectStation(this.activeStation);
    }
  }

  @action
  selectStation(station: Station) {
    const queryParams = this.targetQueryParams(station);

    this.resetSearch();
    void this.router.transitionTo('map.station', station.id, {
      queryParams,
    });
  }

  <template>
    <div ...attributes class="w-full">
      <Popover
        @isOpen={{this.isPopoverOpen}}
        @onOpenChange={{this.handleOpenChange}}
        @placement="bottom-start"
        as |popover|
      >
        <div {{popover.anchor}} class="w-full">
          <FrontileInput
            aria-label={{t "navigation.search.label"}}
            autocomplete="off"
            class="w-full"
            data-test-navbar-search-input
            name="station-search"
            placeholder={{t "navigation.search.placeholder"}}
            @onInput={{this.handleInput}}
            @type="search"
            @value={{this.query}}
            {{on "focus" this.handleFocus}}
            {{on "keydown" this.handleKeydown}}
          />
        </div>

        {{#if this.isPopoverOpen}}
          <popover.Content
            @blockScroll={{false}}
            @class="p-0"
            @closeOnEscapeKey={{true}}
            @closeOnOutsideClick={{true}}
            @disableFocusTrap={{true}}
            @size="trigger"
          >
            <div
              class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/12"
            >
              {{#if this.isLoading}}
                <p
                  data-test-navbar-search-loading
                  class="px-4 py-3 text-sm font-medium text-slate-500"
                >
                  {{t "navigation.search.loading"}}
                </p>
              {{else if this.resultItems.length}}
                <ul
                  aria-label={{t "navigation.search.label"}}
                  data-test-navbar-search-results
                  role="listbox"
                  class="max-h-80 overflow-y-auto p-1"
                >
                  {{#each this.resultItems as |item|}}
                    <li role="presentation">
                      <button
                        aria-selected={{if item.isActive "true" "false"}}
                        class={{item.buttonClass}}
                        data-test-navbar-search-result={{item.station.id}}
                        role="option"
                        type="button"
                        {{on "click" (fn this.selectStation item.station)}}
                        {{on "mousemove" (fn this.activateResult item.index)}}
                      >
                        <span class="min-w-0">
                          <span class="block truncate text-sm font-semibold">
                            {{item.station.name}}
                          </span>

                          {{#if item.distanceLabel}}
                            <span
                              class="mt-0.5 block truncate text-xs text-slate-500"
                            >
                              {{item.distanceLabel}}
                            </span>
                          {{/if}}
                        </span>

                        <span
                          class="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold
                            {{item.windTextClass}}"
                        >
                          <span
                            class="size-2 rounded-full {{item.windDotClass}}"
                          ></span>
                          {{item.windSpeedLabel}}
                        </span>
                      </button>
                    </li>
                  {{/each}}
                </ul>
              {{else if this.hasNoResults}}
                <p
                  data-test-navbar-search-empty
                  class="px-4 py-3 text-sm font-medium text-slate-500"
                >
                  {{t "navigation.search.empty"}}
                </p>
              {{/if}}
            </div>
          </popover.Content>
        {{/if}}
      </Popover>
    </div>
  </template>
}
