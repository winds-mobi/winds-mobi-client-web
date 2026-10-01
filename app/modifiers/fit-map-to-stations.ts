import { modifier } from 'ember-modifier';
import { LngLatBounds } from 'maplibre-gl';
import type { Map as MaplibreMap } from 'ember-maplibre-gl';
import type { Station } from 'winds-mobi-client-web/services/store';
import { FOCUS_ZOOM } from 'winds-mobi-client-web/utils/map-view';

interface FitMapToStationsSignature {
  Element: Element;
  Args: {
    Positional: [MaplibreMap | undefined, Station[]];
  };
}

// Frames a known set of stations. This is the camera-follows-the-data
// direction, the opposite of the main map's, where the data follows the camera
// (see `all.gts`'s `stationsRequest`): nothing else moves this map, so fitting
// it here can't fight another owner the way an extra camera writer on the
// routed map would. MapLibre has no public camera-to-bounds helper, but this
// direction — bounds to camera — is public API.
const fitMapToStations = modifier<FitMapToStationsSignature>(
  (_element, [map, stations]) => {
    if (!map || stations.length === 0) {
      return;
    }

    const bounds = new LngLatBounds();

    for (const station of stations) {
      bounds.extend([station.longitude, station.latitude]);
    }

    // Stations sitting close together would otherwise frame to MapLibre's own
    // maximum zoom — a street-level view with no context around the arrows,
    // past what the map style has tiles for. `FOCUS_ZOOM` is the same
    // comfortable regional zoom every other "look at this station" in the app
    // uses (see utils/map-view.ts).
    map.fitBounds(bounds, { padding: 48, maxZoom: FOCUS_ZOOM, animate: false });
  }
);

export default fitMapToStations;
