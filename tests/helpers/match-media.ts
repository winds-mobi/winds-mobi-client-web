type MatchMediaResult = MediaQueryList & {
  addListener: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener: (listener: (event: MediaQueryListEvent) => void) => void;
};

export function stubMatchMedia(matches: boolean) {
  const originalMatchMedia = window.matchMedia;

  window.matchMedia = ((query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return true;
      },
    }) as MatchMediaResult) as typeof window.matchMedia;

  return () => {
    window.matchMedia = originalMatchMedia;
  };
}
