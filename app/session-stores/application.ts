import AdaptiveStore from 'ember-simple-auth/session-stores/adaptive';

// localStorage-backed (with cookie fallback) so the 30-day JWT survives
// reloads and stays in sync across tabs.
export default class ApplicationSessionStore extends AdaptiveStore {}
