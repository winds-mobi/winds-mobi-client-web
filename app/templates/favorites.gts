import Component from '@glimmer/component';
import { service } from '@ember/service';
import StationIdListPage from 'winds-mobi-client-web/components/station/id-list-page';
import type FavoritesService from 'winds-mobi-client-web/services/favorites';

interface FavoritesTemplateSignature {
  Args: {
    model: unknown;
  };
}

export default class FavoritesTemplate extends Component<FavoritesTemplateSignature> {
  @service declare favorites: FavoritesService;

  <template>
    <StationIdListPage
      @surface="favorites"
      @stationIds={{this.favorites.stationIds}}
    />
  </template>
}
