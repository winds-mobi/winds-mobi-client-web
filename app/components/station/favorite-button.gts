import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { Button } from 'frontile/buttons';
import { t } from 'ember-intl';
import Heart from 'ember-phosphor-icons/components/ph-heart';
import type FavoritesService from 'winds-mobi-client-web/services/favorites';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type { Station } from 'winds-mobi-client-web/services/store.js';

export interface StationFavoriteButtonSignature {
  Args: {
    // Optional so callers can render this unconditionally while a station is
    // still loading (see station/index.gts) -- rendering nothing then is
    // this component's own call, not something the caller should have to
    // guard against first.
    station?: Station;
  };
  Element: null;
}

export default class StationFavoriteButton extends Component<StationFavoriteButtonSignature> {
  @service declare favorites: FavoritesService;
  @service declare settings: SettingsService;

  // Favouriting is a beta feature (see app/services/settings.ts): renders
  // nothing until beta is opted into *and* the favourites feature's own
  // toggle is on. No account is required — favourites persist locally (see
  // app/services/favorites.ts). Self-contained so any caller can drop this
  // in unconditionally, wherever it belongs, without checking the gate
  // itself first.
  get isEnabled(): boolean {
    return (
      this.args.station !== undefined &&
      this.settings.betaFeaturesEnabled &&
      this.settings.favoritesFeatureEnabled
    );
  }

  get isFavorite(): boolean {
    return (
      this.args.station !== undefined &&
      this.favorites.has(this.args.station.id)
    );
  }

  @action
  handleToggleFavorite() {
    if (this.args.station) {
      this.favorites.toggle(this.args.station.id);
    }
  }

  <template>
    {{#if this.isEnabled}}
      <Button
        aria-label={{if
          this.isFavorite
          (t "station.favorite.remove")
          (t "station.favorite.add")
        }}
        aria-pressed={{if this.isFavorite "true" "false"}}
        data-test-station-favorite
        @variant="plain"
        @size="xs"
        @onPress={{this.handleToggleFavorite}}
      >
        {{! size-5! forces the icon past Frontile's own Button base class
        (its [&_svg]:size-[1em] rule scales icons to the button's own
        font-size), which otherwise silently overrides @size entirely --
        CSS width/height always beats an SVG's own presentation
        attributes, regardless of specificity. }}
        <Heart
          @size={{20}}
          @weight={{if this.isFavorite "fill" "regular"}}
          class="size-5!
            {{if this.isFavorite 'text-rose-500' 'text-slate-400'}}"
        />
      </Button>
    {{/if}}
  </template>
}
