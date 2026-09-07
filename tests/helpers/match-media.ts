type MatchMediaResult = MediaQueryList & {
  addListener: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener: (listener: (event: MediaQueryListEvent) => void) => void;
};

export function stubMatchMedia(matches: boolean) {
  const originalMatchMedia = window.matchMedia.bind(window);

  window.matchMedia = (query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => true,
    }) as MatchMediaResult;

  return () => {
    window.matchMedia = originalMatchMedia;
  };
}
