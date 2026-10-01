import { modifier } from 'ember-modifier';
import type { Station } from 'winds-mobi-client-web/services/store';

interface CommitResolvedStationsSignature {
  Element: Element;
  Args: {
    Positional: [Station[], (stations: Station[]) => void];
  };
}

// Commits the station list `<Request>` has just resolved (it runs inside
// `:content`, so the list is always resolved) into the host's own tracked
// latch, which keeps showing the previous list while the next one loads.
const commitResolvedStations = modifier<CommitResolvedStationsSignature>(
  (_element, [stations, commit]) => {
    commit(stations);
  }
);

export default commitResolvedStations;
