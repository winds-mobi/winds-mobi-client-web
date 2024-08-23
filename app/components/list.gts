import Component from '@glimmer/component';
import { ToggleButton } from '@frontile/buttons';
import { t } from 'ember-intl';
import ListBullets from 'ember-phosphor-icons/components/ph-list-bullets';

export interface ListSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class List extends Component<ListSignature> {
  <template>
    <ToggleButton class='flex align-middle items-center gap-2'>
      <ListBullets />
      {{t 'list.toggle'}}
    </ToggleButton>
  </template>
}
