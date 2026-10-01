import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { Button } from 'frontile/buttons';
import { t } from 'ember-intl';
import Heart from 'ember-phosphor-icons/components/ph-heart';
import type FavoritesService from 'winds-mobi-client-web/services/favorites';
import type { Station } from 'winds-mobi-client-web/services/store.js';

export interface StationFavoriteButtonSignature {
  Args: {
    station: Station;
  };
  Element: null;
}

export default class StationFavoriteButton extends Component<StationFavoriteButtonSignature> {
  @service declare favorites: FavoritesService;

  get isFavorite(): boolean {
    return this.favorites.has(this.args.station.id);
  }

  @action
  handleToggleFavorite() {
    this.favorites.toggle(this.args.station.id);
  }

  <template>
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
        class="size-5! {{if this.isFavorite 'text-rose-500' 'text-slate-400'}}"
      />
    </Button>
  </template>
}
