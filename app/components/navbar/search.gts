import Component from '@glimmer/component';
import { action } from '@ember/object';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { cached, tracked } from '@glimmer/tracking';
import type { Future } from '@warp-drive/core/request';
import { getRequestState } from '@warp-drive/core/reactive';
import { rawTimeout, task } from 'ember-concurrency';
import { Listbox } from '@frontile/collections';
import { Input as FrontileInput } from '@frontile/forms';
import { Popover } from '@frontile/overlays';
import { ref } from '@frontile/utilities';
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

  @tracked activeKey?: string;
  @tracked isOpen = false;
  @tracked query = '';

  triggerRef = ref<HTMLInputElement>();

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

  // Schema-record `Station`s throw on access to fields outside their schema
  // (e.g. `.key`), so Listbox's default key/label derivation can't run
  // directly against them — wrap each result in a plain object instead.
  get listboxItems() {
    return this.results.map((station) => ({
      key: station.id,
      label: station.name,
      station,
    }));
  }

  isActiveResult = (key: string) => {
    return key === this.activeKey;
  };

  itemClass = (key: string) => {
    const base = 'rounded-xl px-3 py-2.5 gap-3 transition';

    return this.isActiveResult(key)
      ? `${base} bg-slate-100 text-slate-950`
      : `${base} text-slate-700 hover:bg-slate-50 hover:text-slate-950`;
  };

  private resetSearch() {
    this.query = '';
    this.isOpen = false;
    this.activeKey = undefined;
  }

  @action
  handleInput(value: string) {
    this.query = value;
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
  handleEscapeKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.isOpen = false;
    }
  }

  @action
  setActiveKey(key?: string) {
    this.activeKey = key;
  }

  @action
  selectStationByKey(key: string) {
    const station = this.results.find((result) => result.id === key);

    if (station) {
      this.selectStation(station);
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
            {{this.triggerRef.setup}}
            {{on "focus" this.handleFocus}}
            {{on "keydown" this.handleEscapeKeydown}}
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
              <Listbox
                @items={{this.listboxItems}}
                @elementToAddKeyboardEvents={{this.triggerRef.current}}
                @onAction={{this.selectStationByKey}}
                @onActiveItemChange={{this.setActiveKey}}
                aria-label={{t "navigation.search.label"}}
                data-test-navbar-search-results
                class="max-h-80 overflow-y-auto p-1"
              >
                <:item as |l|>
                  <l.Item
                    @key={{l.key}}
                    @class={{this.itemClass l.key}}
                    aria-selected={{if
                      (this.isActiveResult l.key)
                      "true"
                      "false"
                    }}
                    data-test-navbar-search-result={{l.key}}
                  >
                    <NavbarSearchResult @station={{l.item.station}} />
                  </l.Item>
                </:item>
              </Listbox>
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
