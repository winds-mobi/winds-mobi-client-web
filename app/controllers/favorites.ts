import Controller from '@ember/controller';
import { DEFAULT_VIEW_MODES } from 'winds-mobi-client-web/services/station-view';

export default class FavoritesController extends Controller {
  queryParams = ['view', 'station'];

  view = DEFAULT_VIEW_MODES.favorites;
  station: string | null = null;
}
