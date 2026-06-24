import { modifier } from 'ember-modifier';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

interface RegisterLoadingProbeSignature {
  Element: Element;
  Args: {
    Positional: [MapRefreshService, () => boolean];
  };
}

// Registers a loading probe with the refresh service for as long as the host
// element is rendered, so the navbar refresh control can spin whenever the probe
// reports a request in flight — without the control knowing where the request
// lives. Registration and teardown run in the modifier (post-render) phase, so
// the navbar reading the aggregate never mutates state it already read in the
// same render.
const registerLoadingProbe = modifier<RegisterLoadingProbeSignature>(
  (_element, [mapRefresh, probe]) => mapRefresh.registerLoadingProbe(probe)
);

export default registerLoadingProbe;
