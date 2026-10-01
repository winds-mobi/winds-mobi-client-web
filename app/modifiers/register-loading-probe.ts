import { modifier } from 'ember-modifier';
import type RefreshService from 'winds-mobi-client-web/services/refresh';

interface RegisterLoadingProbeSignature {
  Element: Element;
  Args: {
    Positional: [RefreshService, () => boolean];
  };
}

// Registers a loading probe with the refresh service for as long as the host
// element is rendered, so the navbar refresh control can spin whenever the probe
// reports a request in flight — without the control knowing where the request
// lives. Registration and teardown run in the modifier (post-render) phase, so
// the navbar reading the aggregate never mutates state it already read in the
// same render.
const registerLoadingProbe = modifier<RegisterLoadingProbeSignature>(
  (_element, [refresh, probe]) => refresh.registerLoadingProbe(probe)
);

export default registerLoadingProbe;
