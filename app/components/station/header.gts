import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { LinkTo } from '@ember/routing';
import { Button } from '@frontile/buttons';
import { t } from 'ember-intl';
import Heart from 'ember-phosphor-icons/components/ph-heart';
import type FavoritesService from 'winds-mobi-client-web/services/favorites';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { focusQueryParamsFor } from 'winds-mobi-client-web/utils/map-view';

export interface StationHeaderSignature {
  Args: {
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationHeader extends Component<StationHeaderSignature> {
  @service declare favorites: FavoritesService;
  @service declare settings: SettingsService;

  // Favouriting is a beta feature (see app/services/settings.ts): hidden
  // until beta is opted into *and* the favourites feature's own toggle is on.
  // No account is required — favourites persist locally (see
  // app/services/favorites.ts).
  get showFavoriteControl(): boolean {
    return (
      this.settings.betaFeaturesEnabled && this.settings.favoritesFeatureEnabled
    );
  }

  get isFavorite(): boolean {
    return this.favorites.has(this.args.station.id);
  }

  @action
  handleToggleFavorite() {
    this.favorites.toggle(this.args.station.id);
  }

  <template>
    <div class="flex min-w-0 items-start justify-between gap-2">
      <h2 class="min-w-0 flex-1">
        <LinkTo
          data-test-station-title
          @route="map.station"
          @model={{@station.id}}
          @query={{focusQueryParamsFor @station}}
          title={{t "station.showOnMap"}}
          class="block truncate text-xl font-bold text-slate-950 underline decoration-transparent underline-offset-3 transition hover:decoration-slate-300"
        >
          {{@station.name}}
        </LinkTo>
      </h2>

      {{#if this.showFavoriteControl}}
        <Button
          aria-label={{if
            this.isFavorite
            (t "station.favorite.remove")
            (t "station.favorite.add")
          }}
          aria-pressed={{if this.isFavorite "true" "false"}}
          data-test-station-favorite
          @appearance="minimal"
          @size="sm"
          @onPress={{this.handleToggleFavorite}}
        >
          <Heart
            @size={{20}}
            @weight={{if this.isFavorite "fill" "regular"}}
            class={{if this.isFavorite "text-rose-500" "text-slate-400"}}
          />
        </Button>
      {{/if}}
    </div>
  </template>
}
