import type Application from '@ember/application';
import Highcharts from 'highcharts';
import HighchartsMoreModule from 'highcharts/highcharts-more';

function installHighchartsModule(module: unknown) {
  const loadedModule =
    typeof module === 'object' && module !== null && 'default' in module
      ? module.default
      : module;

  if (typeof loadedModule === 'function') {
    loadedModule(Highcharts);
  }
}

export function initialize(_application: Application) {
  installHighchartsModule(HighchartsMoreModule);
}

export default {
  name: 'highcharts-more',
  initialize,
};
