import { modifier } from 'ember-modifier';
import type { NearbyCoordinates } from 'winds-mobi-client-web/services/nearby-location';

interface FlyToUserLocationSignature {
  Element: Element;
  Args: {
    Positional: [
      // Only read to trigger a re-run when it changes -- `flyTo` (`utils/locate`'s
      // `flyToCoordinates`, bound to the router and the `nearby-location` service)
      // reads the current value itself, so this isn't passed through as a call
      // argument.
      coordinates: NearbyCoordinates | undefined,
      isInitialDefaultView: boolean,
      flyTo: () => void,
    ];
  };
}

// Fires whenever `coordinates` or `isInitialDefaultView` change, not just once at
// setup -- `nearbyLocation.syncPermissionState()` (see `ApplicationRoute#beforeModel`)
// is no longer awaited before render, so coordinates for a returning, already-granted
// user typically arrive *after* the map has already mounted on the default view.
// `isInitialDefaultView` flips to `false` as soon as `flyTo` moves the routed view away
// from the default, so this naturally fires at most once per load without any extra
// guard state.
const flyToUserLocation = modifier<FlyToUserLocationSignature>(
  (_element, [coordinates, isInitialDefaultView, flyTo]) => {
    if (coordinates && isInitialDefaultView) {
      flyTo();
    }
  }
);

export default flyToUserLocation;
