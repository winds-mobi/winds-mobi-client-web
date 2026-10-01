import Controller from '@ember/controller';
import { DEFAULT_VIEW_MODES } from 'winds-mobi-client-web/services/station-view';

export default class HiddenController extends Controller {
  queryParams = ['view', 'station'];

  view = DEFAULT_VIEW_MODES.hidden;
  station: string | null = null;
}
