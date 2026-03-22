import Controller from '@ember/controller';
import {
  DEFAULT_MAP_LAT,
  DEFAULT_MAP_LNG,
  DEFAULT_MAP_ZOOM,
} from 'winds-mobi-client-web/utils/map-view';

export default class MapController extends Controller {
  queryParams = ['mapLng', 'mapLat', 'mapZoom'];

  mapLng = DEFAULT_MAP_LNG;
  mapLat = DEFAULT_MAP_LAT;
  mapZoom = DEFAULT_MAP_ZOOM;
}
