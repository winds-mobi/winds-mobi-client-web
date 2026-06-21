import { module, test } from 'qunit';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Type } from '@warp-drive/core/types/symbols';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import type { History } from 'winds-mobi-client-web/services/store';

type StationLastHourPresenterTestContext = {
  history: History[];
};

module(
  'Integration | Component | station/last-hour/presenter',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders sorted minimum, middle, and maximum wind speeds', async function (this: StationLastHourPresenterTestContext, assert) {
      this.history = [
        {
          id: 'three',
          direction: 200,
          speed: 18,
          gusts: 20,
          temperature: 5,
          humidity: 60,
          rain: 0,
          timestamp: 1_710_000_180_000,
          [Type]: 'history',
        },
        {
          id: 'one',
          direction: 180,
          speed: 12,
          gusts: 14,
          temperature: 6,
          humidity: 63,
          rain: 0,
          timestamp: 1_710_000_000_000,
          [Type]: 'history',
        },
        {
          id: 'two',
          direction: 190,
          speed: 7,
          gusts: 10,
          temperature: 7,
          humidity: 65,
          rain: 0,
          timestamp: 1_710_000_090_000,
          [Type]: 'history',
        },
      ];

      await render(
        hbs`<Station::LastHour::Presenter @history={{this.history}} />`
      );
      await settled();

      assert.dom(this.element).includesText('Maximum');
      assert.dom(this.element).includesText('18 km/h');
      assert.dom(this.element).includesText('Mean');
      assert.dom(this.element).includesText('12 km/h');
      assert.dom(this.element).includesText('Minimum');
      assert.dom(this.element).includesText('7 km/h');
    });
  }
);
