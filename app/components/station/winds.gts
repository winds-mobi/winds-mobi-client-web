import Component from '@glimmer/component';
import HighCharts from 'ember-highcharts/components/high-charts';

export interface StationWindsSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class StationWinds extends Component<StationWindsSignature> {
  get chartData() {
    const speed = this.args.history.map((elm) => elm.speed);
    const gusts = this.args.history.map((elm) => elm.gusts);
    return [
      {
        name: 'Wind',
        data: speed,
      },
      {
        name: 'Gusts',
        data: gusts,
      },
    ];
  }

  <template><HighCharts @content={{this.chartData}} /></template>
}
