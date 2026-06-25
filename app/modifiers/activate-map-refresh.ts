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
    const token = mapRefresh.activate();

    return () => {
      mapRefresh.deactivate(token);
    };
  }
);

export default activateMapRefresh;
