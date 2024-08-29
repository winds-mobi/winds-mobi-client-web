import Component from '@glimmer/component';

export interface StationIndexSignature {
  Args: {
    stationId: string;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class Station extends Component<StationIndexSignature> {
  <template>{{this.args.stationId}}</template>
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    Station: typeof Station;
  }
}
