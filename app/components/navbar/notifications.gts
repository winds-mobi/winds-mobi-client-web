import Component from '@glimmer/component';

export interface NavbarNotificationsSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class NavbarNotifications extends Component<NavbarNotificationsSignature> {
  <template>
    <button
      type='button'
      class='relative flex-shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
    >
      <span class='absolute -inset-1.5'></span>
      <span class='sr-only'>View notifications</span>
      <svg
        class='h-6 w-6'
        fill='none'
        viewBox='0 0 24 24'
        stroke-width='1.5'
        stroke='currentColor'
        aria-hidden='true'
      >
        <path
          stroke-linecap='round'
          stroke-linejoin='round'
          d='M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
        />
      </svg>
    </button>
  </template>
}
