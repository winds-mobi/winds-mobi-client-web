import { modifier } from 'ember-modifier';
import type { Registry as Services } from '@ember/service';
import {
  rememberMapView as storeMapView,
  type MapView,
} from 'winds-mobi-client-web/utils/map-view';

interface RememberMapViewSignature {
  Element: HTMLElement;
  Args: {
    Positional: [Services['tracked-local-storage'], MapView];
  };
}

// Stores the routed map view whenever it changes, for `routes/map.ts` to reopen
// on the next cold start.
const rememberMapView = modifier<RememberMapViewSignature>(
  (_element, [storage, view]) => {
    storeMapView(storage, view);
  }
);

export default rememberMapView;
