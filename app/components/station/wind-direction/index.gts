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
export default class WindDirection extends Component<WindDirectionSignature> {
  <template><WindDirectionGraph @data={{@data}} /></template>
}
