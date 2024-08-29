import Component from '@glimmer/component';
import Centering from '../centering';
import LocationFetcher from '../location-fetcher';
import List from './list';

export interface NavbarButtonsSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class NavbarButtons extends Component<NavbarButtonsSignature> {
  <template>
    <div class='flex flex-1 lg:justify-end px-2 lg:px-0 py-2'>

      <div class='lg:ml-6 flex lg:space-x-8 gap-2'>

        <LocationFetcher />

        <List />

      </div>
    </div>
  </template>
}
