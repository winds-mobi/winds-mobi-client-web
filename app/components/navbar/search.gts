import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { tracked } from '@glimmer/tracking';
import { Autocomplete } from 'frontile/forms';
import { Alert } from 'frontile/status';
import { t } from 'ember-intl';
import Binoculars from 'ember-phosphor-icons/components/ph-binoculars';
import type {
  Station,
  StoreService,
} from 'winds-mobi-client-web/services/store.js';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import { searchQuery } from 'winds-mobi-client-web/builders/station';
import { focusQueryParamsFor } from 'winds-mobi-client-web/utils/map-view';
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

interface SearchResultItem {
  key: string;
  label: string;
  station: Station;
}

export default class NavbarSearch extends Component<NavbarSearchSignature> {
  @service declare router: RouterService;
  @service('nearby-location')
  declare nearbyLocation: NearbyLocationService;
  @service declare store: StoreService;

  @tracked query = '';
  @tracked lastItems: SearchResultItem[] = [];
  @tracked selectedKey: string | null = null;

  get hasEnoughCharacters() {
    return this.query.trim().length >= MIN_SEARCH_LENGTH;
  }

  @action
  handleInputChange(value: string) {
    this.query = value;
  }

  // Bound (not @action) so it can be handed to Autocomplete's own debounce/
  // staleness handling as a plain async function.
  performSearch = async (query: string): Promise<SearchResultItem[]> => {
    const trimmedValue = query.trim();

    if (trimmedValue.length < MIN_SEARCH_LENGTH) {
      this.lastItems = [];
      return this.lastItems;
    }

    const result = await this.store.request<RequestResponse<Station[]>>(
      searchQuery<Station>(
        'station',
        trimmedValue,
        this.nearbyLocation.coordinates
      )
    );

    // Schema-record `Station`s throw on access to fields outside their schema
    // (e.g. `.key`), so Listbox's default key/label derivation can't run
    // directly against them — wrap each result in a plain object instead.
    this.lastItems = responseData(result.content).map((station) => ({
      key: station.id,
      label: station.name,
      station,
    }));

    return this.lastItems;
  };

  @action
  handleSelectionChange(key: string | null) {
    const item = key && this.lastItems.find((entry) => entry.key === key);

    if (!item) {
      return;
    }

    const queryParams = focusQueryParamsFor(item.station);

    this.query = '';
    this.selectedKey = null;

    void this.router.transitionTo('map.station', item.station.id, {
      queryParams,
    });
  }

  <template>
    <div ...attributes class="w-32">
      {{! @label is Frontile's documented way to give Autocomplete an
      accessible name, kept screen-reader-only via its own documented
      data-component anatomy attribute rather than guessing at an internal
      class name. Verified against the real rendered DOM (dump-dom) that as
      of Frontile 0.18.0 this label's `for` (and Autocomplete's own @id arg)
      both target its hidden native <select> form-submission mirror, not the
      visible role="combobox" input -- so the accessible name doesn't
      currently reach the actual control. Shipping as-is per Frontile's own
      documented API rather than working around what looks like an upstream
      gap; revisit if a later Frontile release fixes this. }}
      <Autocomplete
        @label={{t "navigation.search.label"}}
        class="[&_[data-component='label']]:sr-only"
        @popoverSize="md"
        @inputValue={{this.query}}
        @onInputChange={{this.handleInputChange}}
        @onSearch={{this.performSearch}}
        @searchDebounce={{SEARCH_DEBOUNCE_MS}}
        @selectedKey={{this.selectedKey}}
        @onSelectionChange={{this.handleSelectionChange}}
        @closeOnItemSelect={{true}}
        @blockScroll={{false}}
        @hideEmptyContent={{if this.hasEnoughCharacters false true}}
      >
        <:startContent>
          <Binoculars />
        </:startContent>

        <:item as |l|>
          <l.Item @key={{l.key}} data-test-navbar-search-result={{l.key}}>
            <NavbarSearchResult @station={{l.item.station}} />
          </l.Item>
        </:item>

        <:emptyContent>
          <Alert
            data-test-navbar-search-empty
            @status="neutral"
            @title={{t "navigation.search.empty"}}
          />
        </:emptyContent>
      </Autocomplete>
    </div>
  </template>
}
