import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import Component from '@glimmer/component';

interface MyRouteSignature {
  Args: { model: string };
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class MyRoute extends Component<MyRouteSignature> {
  <template>{{pageTitle (t "Index")}}</template>
}
