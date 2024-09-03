import Component from '@glimmer/component';
import TimeSeries from '../chart/time-series';

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
    const speed = this.args.history.map((elm) => [elm.id * 1000, elm.speed]);
    const gusts = this.args.history.map((elm) => [elm.id * 1000, elm.gusts]);
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

  <template>
    <TimeSeries @chartOptions={{undefined}} @chartData={{this.chartData}} />
  </template>
}
