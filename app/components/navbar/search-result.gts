import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import type IntlService from 'ember-intl';
import formatDistanceKm from 'winds-mobi-client-web/helpers/format-distance-km';
import { windBandForSpeed } from 'winds-mobi-client-web/helpers/wind-to-colour';
import type NearbyLocationService from 'winds-mobi-client-web/services/nearby-location';
import type { Station } from 'winds-mobi-client-web/services/store.js';

export interface NavbarSearchResultSignature {
  Args: {
    isActive: boolean;
    onActivate: () => void;
    onSelect: () => void;
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: HTMLButtonElement;
}

export default class NavbarSearchResult extends Component<NavbarSearchResultSignature> {
  @service declare intl: IntlService;
  @service('nearby-location') declare nearbyLocation: NearbyLocationService;

  get buttonClass() {
    return [
      'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition',
      this.args.isActive
        ? 'bg-slate-100 text-slate-950'
        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950',
    ].join(' ');
  }

  get windBand() {
    return windBandForSpeed(this.args.station.last.speed);
  }

  get windSpeedLabel() {
    const { speed } = this.args.station.last;

    return `${this.intl.formatNumber(speed, {
      maximumFractionDigits: speed < 10 ? 1 : 0,
    })} km/h`;
  }

  <template>
    <button
      aria-selected={{if @isActive "true" "false"}}
      class={{this.buttonClass}}
      data-test-navbar-search-result={{@station.id}}
      role="option"
      type="button"
      {{on "click" @onSelect}}
      {{on "mousemove" @onActivate}}
    >
      <span class="min-w-0">
        <span class="block truncate text-sm font-semibold">
          {{@station.name}}
        </span>

        {{#let this.nearbyLocation.coordinates as |coordinates|}}
          {{#let
            (formatDistanceKm
              coordinates.latitude
              coordinates.longitude
              @station.latitude
              @station.longitude
            )
            as |distanceLabel|
          }}
            {{#if distanceLabel}}
              <span class="mt-0.5 block truncate text-xs text-slate-500">
                {{distanceLabel}}
              </span>
            {{/if}}
          {{/let}}
        {{/let}}
      </span>

      <span
        class="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold
          {{this.windBand.textClass}}"
      >
        <span class="size-2 rounded-full {{this.windBand.backgroundClass}}"></span>
        {{this.windSpeedLabel}}
      </span>
    </button>
  </template>
}
