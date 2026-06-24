import { modifier } from 'ember-modifier';

interface MeasureElementSignature {
  Element: Element;
  Args: {
    Positional: [(width: number, height: number) => void];
  };
}

// Reports the host element's content-box pixel size to `onMeasure` on insert and
// on every resize, so a component can derive reactive state from its rendered size
// — here, the map's request bounds from the map's actual pixel dimensions. The
// callback runs in the observer (post-render), so writing tracked state from it
// doesn't clash with reads in the same render.
const measureElement = modifier<MeasureElementSignature>(
  (element, [onMeasure]) => {
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;

      if (rect) {
        onMeasure(Math.round(rect.width), Math.round(rect.height));
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }
);

export default measureElement;
