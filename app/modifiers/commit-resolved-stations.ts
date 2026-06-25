import { modifier } from 'ember-modifier';
import type { RequestState } from '@warp-drive/core/reactive';
import type { Station } from 'winds-mobi-client-web/services/store';
import { responseData } from 'winds-mobi-client-web/utils/request-response';

interface CommitResolvedStationsSignature {
  Element: Element;
  Args: {
    Positional: [
      RequestState<{ data: Station[] }> | undefined,
      (stations: Station[]) => void,
    ];
  };
}

// Latches the last successfully-loaded stations into the host component so the
// previous results stay on screen while a new request (a pan/zoom or refresh tick)
// is in flight. WarpDrive has no "keep previous data" across a query change: when
// the request is recreated its state is pending with no value, so deriving the
// list purely from it would blink results off until the new set resolves. This
// commits each successful result via the bound action; the host's `stations`
// getter renders the live value when resolved and falls back to the last committed
// set while pending. It only ever sees the *current* request state, so a
// superseded request's late resolution can't commit.
const commitResolvedStations = modifier<CommitResolvedStationsSignature>(
  (_element, [state, commit]) => {
    if (state?.isSuccess) {
      commit(responseData(state.value));
    }
  }
);

export default commitResolvedStations;
