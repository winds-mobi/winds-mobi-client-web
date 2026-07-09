import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import Mountains from 'ember-phosphor-icons/components/ph-mountains';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

type StationMetaItemTestContext = {
  icon?: typeof Mountains;
};

module('Integration | Component | station/meta-item', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders the yielded content and an sr-only label', async function (assert) {
    await render(hbs`
      <Station::MetaItem @label="Altitude">
        1,804 m
      </Station::MetaItem>
    `);

    assert.dom('dt').hasText('Altitude').hasClass('sr-only');
    assert.dom('dd').hasText('1,804 m');
    assert.dom('svg').doesNotExist();
  });

  test('it renders the icon when given', async function (this: StationMetaItemTestContext, assert) {
    this.icon = Mountains;

    await render(hbs`
      <Station::MetaItem @label="Peak" @icon={{this.icon}}>
        Peak
      </Station::MetaItem>
    `);

    assert.dom('svg').exists();
  });
});
