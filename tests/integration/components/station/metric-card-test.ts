import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import Wind from 'ember-phosphor-icons/components/ph-wind';
import { setupRenderingTest } from 'winds-mobi-client-web/tests/helpers';

type StationMetricCardTestContext = {
  format?: string;
  value?: number | string;
  icon?: typeof Wind;
};

module('Integration | Component | station/metric-card', function (hooks) {
  setupRenderingTest(hooks);

  const cases: [string, number, string][] = [
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
    test(`it formats ${format} (${value}) as "${expected}"`, async function (this: StationMetricCardTestContext, assert) {
      this.format = format;
      this.value = value;

      await render(hbs`
        <Station::MetricCard @format={{this.format}} @label="x" @value={{this.value}} />
      `);

      assert.dom('dd').hasText(expected);
    });
  }

  test('it falls back to the raw value string with no format given', async function (this: StationMetricCardTestContext, assert) {
    this.value = 'custom';

    await render(hbs`<Station::MetricCard @label="x" @value={{this.value}} />`);

    assert.dom('dd').hasText('custom');
  });

  test('it renders nothing when there is no displayable value', async function (this: StationMetricCardTestContext, assert) {
    await render(hbs`<Station::MetricCard @label="x" @value={{this.value}} />`);
    assert.dom('dd').doesNotExist();

    this.value = Number.NaN;
    await render(hbs`<Station::MetricCard @label="x" @value={{this.value}} />`);
    assert.dom('dd').doesNotExist();

    this.value = '';
    await render(hbs`<Station::MetricCard @label="x" @value={{this.value}} />`);
    assert.dom('dd').doesNotExist();

    this.value = '  ';
    await render(hbs`<Station::MetricCard @label="x" @value={{this.value}} />`);
    assert.dom('dd').doesNotExist();
  });

  test('it renders a finite zero value', async function (this: StationMetricCardTestContext, assert) {
    this.value = 0;

    await render(
      hbs`<Station::MetricCard @format="integer" @label="x" @value={{this.value}} />`
    );

    assert.dom('dd').exists();
  });

  test('the label is visible with no icon and sr-only with one', async function (this: StationMetricCardTestContext, assert) {
    this.value = 12;

    await render(
      hbs`<Station::MetricCard @label="Wind" @value={{this.value}} />`
    );
    assert.dom('dt').hasText('Wind').doesNotHaveClass('sr-only');
    assert.dom('svg').doesNotExist();

    this.icon = Wind;
    await render(hbs`
      <Station::MetricCard @label="Wind" @value={{this.value}} @icon={{this.icon}} />
    `);

    assert.dom('dt').hasText('Wind').hasClass('sr-only');
    assert.dom('svg').exists();
  });
});
