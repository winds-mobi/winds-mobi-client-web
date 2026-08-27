import { modifier } from 'ember-modifier';
import { ALARM_COLOR } from 'winds-mobi-client-web/utils/alarm-color';

interface SelectMapMarkerSignature {
  Element: HTMLElement;
  Args: {
    Positional: [
      isSelected: boolean | undefined,
      isAlarmTriggered?: boolean | undefined,
    ];
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

// A station whose latest reading exceeds its wind-alarm threshold (see
// app/services/alarms.ts, app/components/alarm/watcher.gts). Deliberately a
// real, separate child SVG element appended into the same marker element
// above -- not more classes on it -- so selection and alarm can never fight
// over one shared class list / composed `box-shadow`, and so either one can
// independently change shape later (e.g. this circle becoming a star) without
// touching the other. Sized just inside SELECTED_CLASSES' edge-hugging ring
// (`r="43"` of a 0-50 radius, vs the marker's own full-bleed edge at 50) so
// both read as clearly distinct, concentric circles when a station is
// selected and alarming at the same time.
const ALARM_RING_ATTR = 'data-map-alarm-ring';
const ALARM_RING_CLASSES = ['pointer-events-none', 'absolute', 'inset-0'];
const SVG_NS = 'http://www.w3.org/2000/svg';

function createAlarmRing(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');

  svg.setAttribute(ALARM_RING_ATTR, '');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add(...ALARM_RING_CLASSES);

  const circle = document.createElementNS(SVG_NS, 'circle');

  circle.setAttribute('cx', '50');
  circle.setAttribute('cy', '50');
  circle.setAttribute('r', '43');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', ALARM_COLOR);
  circle.setAttribute('stroke-width', '5');
  svg.append(circle);

  return svg;
}

const selectMapMarker = modifier<SelectMapMarkerSignature>(
  (element, [isSelected, isAlarmTriggered]) => {
    const parent = element.parentElement;

    if (!parent) {
      return;
    }

    if (isSelected) {
      parent.classList.add(...SELECTED_CLASSES);
    } else {
      parent.classList.remove(...SELECTED_CLASSES);
    }

    const existingAlarmRing = parent.querySelector(
      `:scope > [${ALARM_RING_ATTR}]`
    );

    if (isAlarmTriggered) {
      if (!existingAlarmRing) {
        parent.append(createAlarmRing());
      }
    } else {
      existingAlarmRing?.remove();
    }

    return () => {
      parent.classList.remove(...SELECTED_CLASSES);
      parent.querySelector(`:scope > [${ALARM_RING_ATTR}]`)?.remove();
    };
  }
);

export default selectMapMarker;
