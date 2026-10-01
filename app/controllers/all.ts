import Controller from '@ember/controller';
import {
  DEFAULT_MAP_LAT,
  DEFAULT_MAP_LNG,
  DEFAULT_MAP_ZOOM,
} from 'winds-mobi-client-web/utils/map-view';
import { DEFAULT_VIEW_MODES } from 'winds-mobi-client-web/services/station-view';

export default class AllController extends Controller {
  queryParams = ['longitude', 'latitude', 'zoom', 'view', 'station'];

  longitude = DEFAULT_MAP_LNG;
  latitude = DEFAULT_MAP_LAT;
  zoom = DEFAULT_MAP_ZOOM;
  view = DEFAULT_VIEW_MODES.all;
  station: string | null = null;
}
