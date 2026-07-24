import { modifier } from 'ember-modifier';

interface SelectMapMarkerSignature {
  Element: HTMLElement;
  Args: {
    Positional: [isSelected: boolean | undefined];
  };
}

// The selected-station ring/disc lives on MapLibre's own marker element --
// this modifier's host element's own parent, since `station-marker.gts`
// renders directly inside it via `{{#in-element}}` -- not on our own inner
// content. That outer element is the one `<marker.on @event="click">`
// actually listens on and the one that shrink-wraps to the marker's real
// current size (see `map/index.gts`'s `markerInitOptions` comment), so the
// ring needs to render there to match both.
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
