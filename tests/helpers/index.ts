import {
  setupApplicationTest as upstreamSetupApplicationTest,
  setupRenderingTest as upstreamSetupRenderingTest,
  setupTest as upstreamSetupTest,
  type SetupTestOptions,
} from 'ember-qunit';
import { setupIntl } from 'ember-intl/test-support';
import { formats } from 'winds-mobi-client-web/ember-intl';
import translationsForEnUs from 'virtual:ember-intl/translations/en-us';
import type Owner from '@ember/owner';
import type { RenderingTestContext } from '@ember/test-helpers';

// @ember/test-helpers types `element` as `Element | Document`, but in a
// rendering test it is always the testing container element — and qunit-dom's
// target/rootElement parameters accept only `Element`. Narrowing the property
// here (legal: `Element` is assignable to `Element | Document`) lets tests
// hand `this.element` to `assert.dom` without casts. Extend this instead of
// RenderingTestContext when a rendering test declares a custom `this` type.
export interface RenderedTestContext extends RenderingTestContext {
  element: Element;
}

// This file exists to provide wrappers around ember-qunit's
// test setup functions. This way, you can easily extend the setup that is
// needed per test type.

// ember-tracked-local-storage's service owns an in-memory reactive cell per
// key that only ever seeds from `localStorage` once, so a test that leaves a
// non-default value behind pollutes every later test reading that key —
// even across files. Clearing through the service (not raw
// `localStorage.removeItem`) matches the addon's own test suite and wipes
// both layers: the persisted value and the cached cell. Called before every
// test type since `service:settings` (or any future consumer) could be
// touched from unit, rendering, or application tests alike.
function resetTrackedLocalStorage(owner: Owner) {
  owner.lookup('service:tracked-local-storage').clear();
}

function setupApplicationTest(hooks: NestedHooks, options?: SetupTestOptions) {
  upstreamSetupApplicationTest(hooks, options);
  setupIntl(hooks, 'en-us');

  hooks.beforeEach(function () {
    const intl = this.owner.lookup('service:intl');

    intl.addTranslations('en-us', translationsForEnUs);
    intl.setFormats(formats);
    resetTrackedLocalStorage(this.owner);
  });

  // Additional setup for application tests can be done here.
  //
  // For example, if you need an authenticated session for each
  // application test, you could do:
  //
  // hooks.beforeEach(async function () {
  //   await authenticateSession(); // ember-simple-auth
  // });
  //
  // This is also a good place to call test setup functions coming
  // from other addons:
  //
  // setupIntl(hooks, 'en-us'); // ember-intl
}

function setupRenderingTest(hooks: NestedHooks, options?: SetupTestOptions) {
  upstreamSetupRenderingTest(hooks, options);
  setupIntl(hooks, 'en-us');

  hooks.beforeEach(function () {
    const intl = this.owner.lookup('service:intl');

    intl.addTranslations('en-us', translationsForEnUs);
    intl.setFormats(formats);
    resetTrackedLocalStorage(this.owner);
  });

  // Additional setup for rendering tests can be done here.
}

function setupTest(hooks: NestedHooks, options?: SetupTestOptions) {
  upstreamSetupTest(hooks, options);
  setupIntl(hooks, 'en-us');

  hooks.beforeEach(function () {
    const intl = this.owner.lookup('service:intl');

    intl.addTranslations('en-us', translationsForEnUs);
    intl.setFormats(formats);
    resetTrackedLocalStorage(this.owner);
  });

  // Additional setup for unit tests can be done here.
}

export { setupApplicationTest, setupRenderingTest, setupTest };
