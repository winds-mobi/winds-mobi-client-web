import Component from '@glimmer/component';
import { t } from 'ember-intl';

export interface NavbarSearchSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class NavbarSearch extends Component<NavbarSearchSignature> {
  <template>
    <div class='flex items-center justify-center px-2 lg:ml-6 lg:justify-end'>
      <div class='w-full max-w-lg lg:max-w-xs'>
        <label for='search' class='sr-only'>{{t 'Search'}}</label>
        <div class='relative'>
          <div
            class='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'
          >
            <svg
              class='h-5 w-5 text-gray-400'
              viewBox='0 0 20 20'
              fill='currentColor'
              aria-hidden='true'
            >
              <path
                fill-rule='evenodd'
                d='M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z'
                clip-rule='evenodd'
              />
            </svg>
          </div>
          <input
            id='search'
            name='search'
            class='block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
            placeholder={{t 'Search'}}
            type='search'
          />
        </div>
      </div>
    </div>
  </template>
}
