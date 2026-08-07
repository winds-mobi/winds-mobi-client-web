import type { Map as MaplibreMap } from 'ember-maplibre-gl';
import type { PaddingOptions } from 'maplibre-gl';

// MapLibre types every edge as optional (an unset one means 0); this app always
// states all four, so its own padding values are safe to do arithmetic on.
export type MapPadding = Required<PaddingOptions>;

export const NO_MAP_PADDING: MapPadding = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

// Sub-pixel layout rounding: a full-bleed overlay can miss its container's own
// size by a fraction, so "spans the whole width/height" is a near-comparison
// rather than an exact one.
const EDGE_TOLERANCE = 1;

// How much of the map the station panel covers, in MapLibre `padding` terms
// (its own "edge insets" / vanishing-point concept). Measured from the overlay
// slot's real geometry rather than re-declaring the panel's Tailwind sizes and
// breakpoints in TypeScript, so the two can't drift.
//
// The slot always covers a full-width or full-height slab against one edge of
// the map (a bottom sheet in portrait, a side panel in landscape and on
// desktop), which is what makes the uncovered area a rectangle MapLibre can
// express as padding: whichever edge the slab sits against gets its thickness,
// the other three stay 0.
export function mapPaddingFromOverlay(overlay: HTMLElement): MapPadding {
  // The slot is absolutely positioned inside the map's own box, so its offset
  // geometry is already relative to exactly the box MapLibre pads. Offsets
  // rather than `getBoundingClientRect`, because MapLibre's padding is in the
  // map's own CSS pixels: a bounding rect is measured in *rendered* pixels and
  // comes back scaled wherever an ancestor carries a transform, which is how
  // Ember's own test container renders the whole app (`scale(0.5)`).
  const container = overlay.offsetParent;

  if (!(container instanceof HTMLElement)) {
    return NO_MAP_PADDING;
  }

  const width = container.clientWidth;
  const height = container.clientHeight;

  if (overlay.offsetWidth >= width - EDGE_TOLERANCE) {
    return overlay.offsetTop > 0
      ? { ...NO_MAP_PADDING, bottom: height - overlay.offsetTop }
      : { ...NO_MAP_PADDING, top: overlay.offsetHeight };
  }

  if (overlay.offsetHeight >= height - EDGE_TOLERANCE) {
    return overlay.offsetLeft > 0
      ? { ...NO_MAP_PADDING, right: width - overlay.offsetLeft }
      : { ...NO_MAP_PADDING, left: overlay.offsetWidth };
  }

  return NO_MAP_PADDING;
}

export function mapPaddingsEqual(
  left: PaddingOptions,
  right: PaddingOptions
): boolean {
  return (
    (left.top ?? 0) === (right.top ?? 0) &&
    (left.bottom ?? 0) === (right.bottom ?? 0) &&
    (left.left ?? 0) === (right.left ?? 0) &&
    (left.right ?? 0) === (right.right ?? 0)
  );
}

// Sets the map's padding without moving a single pixel of what's on screen.
//
// Padding is not framing bookkeeping — it moves the vanishing point, the screen
// position the map draws its center at (`EdgeInsets#getCenter`, below). Setting
// it on its own therefore slides the whole map by half the panel, which is
// exactly the heave this app is getting rid of. Handing MapLibre a new center
// in the same call is what absorbs it: whatever is drawn at the point the
// vanishing point is *about to* move to becomes the center, so it is drawn at
// that same point afterwards and nothing shifts.
//
// The center is a real change though, and a deliberate one: while the panel is
// open the map's center is the middle of the part it leaves visible, which is
// what `getCenter`, the zoom buttons, and every later `flyTo` should mean.
// Framing a station against the open panel needs nothing further — an ordinary
// `flyTo(center)` already lands it there.
//
// A no-op when the padding already matches, so this can run before a `flyTo`
// without stopping it (MapLibre's camera methods stop whatever is in flight).
export function applyMapPadding(map: MaplibreMap, padding: MapPadding): void {
  const current = map.getPadding();

  if (mapPaddingsEqual(current, padding)) {
    return;
  }

  // Where the vanishing point is about to move to. Expressed as a shift of the
  // one MapLibre is using right now — which is where it projects its own center
  // — so the map's dimensions cancel out of the arithmetic and never have to be
  // read: `EdgeInsets#getCenter` is `(left + width - right) / 2` per axis, and
  // the same `width` sits in both the old and new value.
  const centerPoint = map.project(map.getCenter());
  const vanishingPoint: [number, number] = [
    centerPoint.x +
      (padding.left -
        padding.right -
        ((current.left ?? 0) - (current.right ?? 0))) /
        2,
    centerPoint.y +
      (padding.top -
        padding.bottom -
        ((current.top ?? 0) - (current.bottom ?? 0))) /
        2,
  ];

  map.jumpTo({ center: map.unproject(vanishingPoint), padding });
}
