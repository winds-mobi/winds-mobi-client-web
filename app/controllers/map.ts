import Controller from '@ember/controller';
import {
  DEFAULT_MAP_LAT,
  DEFAULT_MAP_LNG,
  DEFAULT_MAP_ZOOM,
} from 'winds-mobi-client-web/utils/map-view';

export default class MapController extends Controller {
  queryParams = ['longitude', 'latitude', 'zoom'];

  longitude = DEFAULT_MAP_LNG;
  latitude = DEFAULT_MAP_LAT;
  zoom = DEFAULT_MAP_ZOOM;
}
