import Component from "@glimmer/component";

export interface TimeSeriesSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class TimeSeries extends Component<TimeSeriesSignature> {
  <template>
    {{yield}}
  </template>
}
