import { module, test } from 'qunit';
import { render, type RenderingTestContext } from '@ember/test-helpers';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import StationMetaItem from 'winds-mobi-client-web/components/station/meta-item';

interface StationMetaItemTestContext extends RenderingTestContext {
  icon?: typeof Mountains;
}

module('Integration | Component | station/meta-item', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders the yielded content and an sr-only label', async function (assert) {
    await render(
      <template>
        <StationMetaItem @label="Altitude">
          1,804 m
        </StationMetaItem>
      </template>
    );

    assert.dom('dt').hasText('Altitude').hasClass('sr-only');
    assert.dom('dd').hasText('1,804 m');
    assert.dom('svg').doesNotExist();
  });

  test('it renders the icon when given', async function (this: StationMetaItemTestContext, assert) {
    const icon: StationMetaItemTestContext['icon'] = Mountains;

    await render(
      <template>
        <StationMetaItem @label="Peak" @icon={{icon}}>
          Peak
        </StationMetaItem>
      </template>
    );

    assert.dom('svg').exists();
  });
});
