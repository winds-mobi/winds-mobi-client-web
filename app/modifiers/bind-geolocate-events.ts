import { modifier } from 'ember-modifier';
import type { GeolocateControl } from 'maplibre-gl';

export interface GeolocateEventHandlers {
  onStart: () => void;
  onGeolocate: (position: GeolocationPosition) => void;
  onError: (error?: GeolocationPositionError) => void;
}

interface BindGeolocateEventsSignature {
  Element: HTMLElement;
  Args: {
    Positional: [GeolocateControl, GeolocateEventHandlers];
  };
}

// Subscribe to a MapLibre GeolocateControl's events for the element's lifetime,
// tearing the subscriptions down on destroy — instead of binding imperatively
// with a one-time guard flag.
const bindGeolocateEvents = modifier<BindGeolocateEventsSignature>(
  (_element, [control, handlers]) => {
    const onStart = () => handlers.onStart();
    const onGeolocate = (event: { data: GeolocationPosition }) =>
      handlers.onGeolocate(event.data);
    const onError = (event: { data?: GeolocationPositionError }) =>
      handlers.onError(event.data);

    control.on('trackuserlocationstart', onStart);
    control.on('geolocate', onGeolocate);
    control.on('error', onError);

    return () => {
      control.off('trackuserlocationstart', onStart);
      control.off('geolocate', onGeolocate);
      control.off('error', onError);
    };
  }
);

export default bindGeolocateEvents;
