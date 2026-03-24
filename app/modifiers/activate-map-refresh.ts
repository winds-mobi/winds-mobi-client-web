import { modifier } from 'ember-modifier';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

interface ActivateMapRefreshSignature {
  Element: HTMLElement;
  Args: {
    Positional: [MapRefreshService];
  };
}

const activateMapRefresh = modifier<ActivateMapRefreshSignature>(
  (_element, [mapRefresh]) => {
    mapRefresh.activate();

    return () => {
      mapRefresh.deactivate();
    };
  }
);

export default activateMapRefresh;
