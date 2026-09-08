import { modifier } from 'ember-modifier';

interface TrackMediaQuerySignature {
  Element: HTMLElement;
  Args: {
    Positional: [query: string, callback: (matches: boolean) => void];
  };
}

const trackMediaQuery = modifier<TrackMediaQuerySignature>(
  (_element, [query, callback]) => {
    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) =>
      callback(event.matches);

    callback(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', handleChange);

    return () => mediaQueryList.removeEventListener('change', handleChange);
  }
);

export default trackMediaQuery;
