import Component from '@glimmer/component';

export interface NavbarLogoSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class NavbarLogo extends Component<NavbarLogoSignature> {
  <template>
    <div class='flex flex-shrink-0 items-center'>
      <img
        class='h-8 w-auto'
        src='https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600'
        alt='Your Company'
      />
    </div>
  </template>
}
