import { modifier } from 'ember-modifier';
import type RouterService from '@ember/routing/router-service';

interface OnRouteChangeSignature {
  Element: HTMLElement;
  Args: {
    Positional: [RouterService, () => void];
  };
}

const onRouteChange = modifier<OnRouteChangeSignature>(
  (_element, [router, callback]) => {
    router.on('routeDidChange', callback);

    return () => router.off('routeDidChange', callback);
  }
);

export default onRouteChange;
