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

// The same condition the station panel's overlay slot uses to switch shape
// (see `app/components/map/index.gts`'s slot div: default is a bottom sheet,
// `landscape:`/`md:` switch to a side panel) and the Drawer uses to switch
// slide direction (`app/components/station/index.gts`). One shared constant
// so the three can't drift apart.
export const SIDE_PANEL_QUERY = '(orientation: landscape), (min-width: 768px)';

// How much of the map the station panel covers, in MapLibre `padding` terms
// (its own "edge insets" / vanishing-point concept). Hardcoded to Frontile's
// own `--drawer-sm` (30rem, at the default 16px root font size) rather than
// measured from the panel's rendered geometry — the station panel's
// `@size="sm"` is Frontile's own size for the panel in both placements, so
// this is the actual size the Drawer renders at, not an app-invented number.
// Keep in sync with `@size` on the Drawer in `app/components/station/index.gts`.
const DRAWER_SM_PX = 480;

export function mapPaddingForPlacement(isSidePanel: boolean): MapPadding {
  return isSidePanel
    ? { ...NO_MAP_PADDING, left: DRAWER_SM_PX }
    : { ...NO_MAP_PADDING, bottom: DRAWER_SM_PX };
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
