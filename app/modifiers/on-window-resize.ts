import { modifier } from 'ember-modifier';

interface OnWindowResizeSignature {
  Element: Element;
  Args: {
    Positional: [() => void];
  };
}

// Calls back whenever the window resizes, for as long as the host element is
// rendered. `all.gts` uses it to re-project its request bounds: the routed
// view gives the centre and zoom, the window gives the size. The callback runs
// from a real resize event rather than during render, which is what keeps
// writing tracked state from it safe.
const onWindowResize = modifier<OnWindowResizeSignature>(
  (_element, [callback]) => {
    window.addEventListener('resize', callback);

    return () => window.removeEventListener('resize', callback);
  }
);

export default onWindowResize;
