import Component from '@glimmer/component';
import type { History } from 'winds-mobi-client-web/services/store.js';
import WindDirectionGraph from './graph';

export interface WindDirectionSignature {
  Args: {
    data: History[];
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

const DURATION = 1 * 60 * 60;

export default class WindDirection extends Component<WindDirectionSignature> {
  get recentHistory() {
    const minTimestamp = Date.now() - DURATION * 1000;

    return this.args.data.filter((record) => record.timestamp >= minTimestamp);
  }

  <template><WindDirectionGraph @data={{this.recentHistory}} /></template>
}
