import { modifier } from 'ember-modifier';
import type RefreshService from 'winds-mobi-client-web/services/refresh';

interface ActivateRefreshSignature {
  Element: HTMLElement;
  Args: {
    Positional: [RefreshService];
  };
}

const activateRefresh = modifier<ActivateRefreshSignature>(
  (_element, [refresh]) => {
    const token = refresh.activate();

    return () => {
      refresh.deactivate(token);
    };
  }
);

export default activateRefresh;
