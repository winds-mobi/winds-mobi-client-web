import { modifier } from 'ember-modifier';

interface SelectMapMarkerSignature {
  Element: HTMLElement;
  Args: {
    Positional: [isSelected: boolean | undefined];
  };
}

// The selected-station ring/disc has to live on MapLibre's own marker
// element -- this modifier's host element's own parent, since
// `station-marker.gts` renders directly inside it via `{{#in-element}}` --
// not on our own inner content. That outer element stays at full, unscaled
// size regardless of the marker's own age/zoom shrink (`markerScale`'s
// `transform: scale(...)` lives on our inner content only), and it's also
// the element `<marker.on @event="click">` actually listens on: painting
// the "this is selected" indicator anywhere else risks the same
// visual/interactive mismatch the `cursor-pointer` fix (see
// `markerInitOptions` in map/index.gts) already addressed for hovering.
//
// `MarkerOptions.className` (the mechanism `cursor-pointer` uses) can't
// carry this, though: ember-maplibre-gl only reads `@initOptions` once, in
// its constructor, and selection changes over the marker's lifetime as the
// user clicks around -- so this reaches the real DOM node directly and
// toggles classes imperatively instead, the supported way to integrate with
// a third-party library's own DOM structure when it offers no reactive hook
// of its own.
const SELECTED_CLASSES = [
  'bg-slate-400/40',
  'ring-1',
  'ring-inset',
  'ring-slate-500/70',
];

const selectMapMarker = modifier<SelectMapMarkerSignature>(
  (element, [isSelected]) => {
    const parent = element.parentElement;

    if (!parent) {
      return;
    }

    if (isSelected) {
      parent.classList.add(...SELECTED_CLASSES);
    } else {
      parent.classList.remove(...SELECTED_CLASSES);
    }

    return () => parent.classList.remove(...SELECTED_CLASSES);
  }
);

export default selectMapMarker;
