import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import StationSectionCard from 'winds-mobi-client-web/components/station/section-card';

module('Integration | Component | station/section-card', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders the title and yielded content', async function (assert) {
    await render(
      <template>
        <StationSectionCard @title="Wind">
          <p>Section content</p>
        </StationSectionCard>
      </template>
    );

    assert.dom('section > div p').hasText('Section content');
    assert.dom('section > p').hasText('Wind');
  });

  test('it applies an extra title class when given', async function (assert) {
    await render(
      <template>
        <StationSectionCard @title="Wind" @titleClass="text-rose-600">
          content
        </StationSectionCard>
      </template>
    );

    assert.dom('section > p').hasClass('text-rose-600');
  });
});
