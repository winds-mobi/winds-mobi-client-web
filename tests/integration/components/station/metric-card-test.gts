import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import Wind from 'ember-phosphor-icons/components/ph-wind';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';
import StationMetricCard, {
  type StationMetricFormat,
} from 'winds-mobi-client-web/components/station/metric-card';

module('Integration | Component | station/metric-card', function (hooks) {
  setupRenderingTest(hooks);

  const cases: [StationMetricFormat, number, string][] = [
    ['windSpeed', 12, '12 km/h'],
    ['temperature', 7, '7°C'],
    ['humidity', 65, '65%'],
    ['integer', 1804, '1,804'],
    ['litersPerSecond', 2.5, '2.5 L/s'],
    ['pressure', 1012, '1,012hPa'],
    ['rainfall', 2.5, '2.5l/m²'],
    ['rainfall', 0, '0l/m²'],
    ['azimuth', 90, 'E 90°'],
  ];

  for (const [format, value, expected] of cases) {
    test(`it formats ${format} (${value}) as "${expected}"`, async function (assert) {
      await render(
        <template>
          <StationMetricCard @format={{format}} @label="x" @value={{value}} />
        </template>
      );

      assert.dom('dd').hasText(expected);
    });
  }

  test('it falls back to the raw value string with no format given', async function (assert) {
    await render(
      <template><StationMetricCard @label="x" @value="custom" /></template>
    );

    assert.dom('dd').hasText('custom');
  });

  test('it renders nothing when there is no displayable value', async function (assert) {
    for (const value of [undefined, Number.NaN, '', '  ']) {
      await render(
        <template><StationMetricCard @label="x" @value={{value}} /></template>
      );

      assert.dom('dd').doesNotExist(`nothing for ${JSON.stringify(value)}`);
    }
  });

  test('it renders a finite zero value', async function (assert) {
    await render(
      <template>
        <StationMetricCard @format="integer" @label="x" @value={{0}} />
      </template>
    );

    assert.dom('dd').exists();
  });

  test('the label is visible with no icon and sr-only with one', async function (assert) {
    await render(
      <template><StationMetricCard @label="Wind" @value={{12}} /></template>
    );
    assert.dom('dt').hasText('Wind').doesNotHaveClass('sr-only');
    assert.dom('svg').doesNotExist();

    await render(
      <template>
        <StationMetricCard @label="Wind" @value={{12}} @icon={{Wind}} />
      </template>
    );

    assert.dom('dt').hasText('Wind').hasClass('sr-only');
    assert.dom('svg').exists();
  });
});
