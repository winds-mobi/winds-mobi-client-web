import Component from '@glimmer/component';

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
    <div class='flex flex-1 lg:justify-end px-2 lg:px-0'>

      <div class='hidden lg:ml-6 lg:flex lg:space-x-8'>
        {{! Current: "border-indigo-500 text-gray-900", Default: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700" }}
        <a
          href='#'
          class='inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-900'
        >Dashboard</a>
        <a
          href='#'
          class='inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700'
        >Team</a>
        <a
          href='#'
          class='inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700'
        >Projects</a>
        <a
          href='#'
          class='inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700'
        >Calendar</a>
      </div>
    </div>
  </template>
}
