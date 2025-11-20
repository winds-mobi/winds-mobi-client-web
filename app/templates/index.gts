import Component from '@glimmer/component';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';

interface MyRouteSignature {
  Args: { model: string };
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class MyRoute extends Component<MyRouteSignature> {
  <template>
    {{pageTitle (t "Index")}}
    {{outlet}}
  </template>
}
