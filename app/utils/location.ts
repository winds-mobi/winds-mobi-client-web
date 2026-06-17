// A bare geographic point. Shared by anything that needs only latitude and
// longitude (the search location bias, the nearby-location service, …) so the
// shape is defined once rather than re-inlined per consumer.
export type Coordinates = {
  latitude: number;
  longitude: number;
};

export const DEFAULT_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 5 * 60 * 1000,
  timeout: 15_000,
};
