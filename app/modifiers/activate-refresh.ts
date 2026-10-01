import { modifier } from 'ember-modifier';
import type RefreshService from 'winds-mobi-client-web/services/refresh';

interface ActivateRefreshSignature {
  Element: HTMLElement;
  Args: {
    Positional: [RefreshService];
  };
}

// Runs the refresh countdown while the attached element is mounted.
const activateRefresh = modifier<ActivateRefreshSignature>(
  (_element, [refresh]) => refresh.start()
);

export default activateRefresh;
