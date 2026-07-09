import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

module('Integration | Component | station/section-card', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders the title and yielded content', async function (assert) {
    await render(hbs`
      <Station::SectionCard @title="Wind">
        <p>Section content</p>
      </Station::SectionCard>
    `);

    assert.dom('section > div p').hasText('Section content');
    assert.dom('section > p').hasText('Wind');
  });

  test('it applies an extra title class when given', async function (assert) {
    await render(hbs`
      <Station::SectionCard @title="Wind" @titleClass="text-rose-600">
        content
      </Station::SectionCard>
    `);

    assert.dom('section > p').hasClass('text-rose-600');
  });
});
