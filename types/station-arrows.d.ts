// Geometry for each station arrow, generated at build time from the SVGs under
// public/images by the `station-arrows` Vite plugin (see build/).
declare module 'virtual:station-arrows' {
  export interface StationArrowGeometryData {
    // Arrow body path `d`, normalised to the canonical unit height.
    path: string;
    // viewBox mapping that coordinate space into the marker box.
    viewBox: string;
    // "x y" the marker rotates (and age-scales) the arrow about — the hub centre.
    rotationCentre: string;
    // The gusts disc shape `d` (the id="gusts" marker), drawn behind the arrow.
    gustsPath: string;
    // Clip-safe square viewBox centred on the hub, for the browser-tab favicon.
    faviconViewBox: string;
  }

  export const arrows: {
    notPeak: StationArrowGeometryData;
    peak: StationArrowGeometryData;
  };
}
