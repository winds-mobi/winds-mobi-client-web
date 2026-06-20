import Component from '@glimmer/component';
import { action } from '@ember/object';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { cached, tracked } from '@glimmer/tracking';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { rawTimeout, task } from 'ember-concurrency';
import { Input as FrontileInput } from '@frontile/forms';
import { Popover } from '@frontile/overlays';
import { t } from 'ember-intl';
import Binoculars from 'ember-phosphor-icons/components/ph-binoculars';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import { searchQuery } from 'winds-mobi-client-web/builders/station';
import { FOCUS_ZOOM } from 'winds-mobi-client-web/utils/map-view';
import {
  type RequestResponse,
  responseData,
} from 'winds-mobi-client-web/utils/request-response';
import NavbarSearchResult from './search-result';

export interface NavbarSearchSignature {
  Args: Record<string, never>;
  Element: HTMLDivElement;
}

const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 200;

export default class NavbarSearch extends Component<NavbarSearchSignature> {
  @service declare router: RouterService;
  @service('nearby-location')
  declare nearbyLocation: NearbyLocationService;
  @service
  declare store: typeof import('winds-mobi-client-web/services/store').default;

  @tracked activeResultIndex = 0;
  @tracked isOpen = false;
  @tracked query = '';

  updateDebouncedQuery = task({ restartable: true }, async (value: string) => {
    const trimmedValue = value.trim();

    if (trimmedValue.length < MIN_SEARCH_LENGTH) {
      return '';
    }

    await rawTimeout(SEARCH_DEBOUNCE_MS);

    return trimmedValue;
  });

  @cached
  get request(): Future<RequestResponse<Station[]>> | undefined {
    if (this.settledQuery.length < MIN_SEARCH_LENGTH) {
      return undefined;
    }

    return this.store.request<RequestResponse<Station[]>>(
      searchQuery<Station>(
        'station',
        this.settledQuery,
        this.nearbyLocation.coordinates
      )
    );
  }

  get requestState() {
    return this.request ? getRequestState(this.request) : undefined;
  }

  get settledQuery() {
    const value = this.updateDebouncedQuery.lastSuccessful?.value;

    return value === this.trimmedQuery ? value : '';
  }

  get trimmedQuery() {
    return this.query.trim();
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
    return this.trimmedQuery.length >= MIN_SEARCH_LENGTH;
  }

  get hasNoResults() {
    return (
      this.settledQuery.length >= MIN_SEARCH_LENGTH &&
      this.requestState?.isSuccess === true &&
      this.results.length === 0
    );
  }

  get isPopoverOpen() {
    return this.isOpen && this.hasEnoughCharacters;
  }

  isActiveResult = (index: number) => {
    return index === this.clampedActiveResultIndex;
  };

  private resetSearch() {
    this.query = '';
    this.isOpen = false;
  }

  @action
  handleInput(value: string) {
    this.query = value;
    this.activeResultIndex = 0;
    this.isOpen = this.hasEnoughCharacters;

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
    const queryParams = {
      latitude: station.latitude,
      longitude: station.longitude,
      zoom: FOCUS_ZOOM,
    };

    this.resetSearch();

    void this.router.transitionTo('map.station', station.id, {
      queryParams,
    });
  }

  <template>
    <div ...attributes class="w-32">
      <Popover
        @isOpen={{this.isPopoverOpen}}
        @onOpenChange={{this.handleOpenChange}}
        @placement="bottom-start"
        as |popover|
      >
        <div {{popover.anchor}} class="w-full">
          {{! @onInput is Frontile Input's supported public API, not a native event handler }}
          {{! template-lint-disable no-passed-in-event-handlers }}
          <FrontileInput
            aria-label={{t "navigation.search.label"}}
            autocomplete="off"
            class="w-full h-12"
            data-test-navbar-search-input
            name="station-search"
            @onInput={{this.handleInput}}
            @type="search"
            @value={{this.query}}
            {{on "focus" this.handleFocus}}
            {{on "keydown" this.handleKeydown}}
          >
            <:startContent>
              <Binoculars />
            </:startContent>
          </FrontileInput>
          {{! template-lint-enable no-passed-in-event-handlers }}
        </div>

        {{#if this.isPopoverOpen}}
          <popover.Content
            @blockScroll={{false}}
            @class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-xl shadow-slate-900/12"
            @closeOnEscapeKey={{true}}
            @closeOnOutsideClick={{true}}
            @disableFocusTrap={{true}}
            @preventAutoFocus={{true}}
            @size="trigger"
          >
            {{#if this.isLoading}}
              <p
                data-test-navbar-search-loading
                class="px-4 py-3 text-sm font-medium text-slate-500"
              >
                {{t "navigation.search.loading"}}
              </p>
            {{else if this.results.length}}
              <ul
                aria-label={{t "navigation.search.label"}}
                data-test-navbar-search-results
                role="listbox"
                class="max-h-80 overflow-y-auto p-1"
              >
                {{#each this.results as |station index|}}
                  <li role="presentation">
                    <NavbarSearchResult
                      @isActive={{this.isActiveResult index}}
                      @onActivate={{fn this.activateResult index}}
                      @onSelect={{fn this.selectStation station}}
                      @station={{station}}
                    />
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
          </popover.Content>
        {{/if}}
      </Popover>
    </div>
  </template>
}
