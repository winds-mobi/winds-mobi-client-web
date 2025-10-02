import Component from '@glimmer/component';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import Navbar from 'winds-mobi-client-web/components/navbar';
import { PortalTarget } from '@frontile/overlays';

interface MyRouteSignature {
  Args: { model: string };
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class MyRoute extends Component<MyRouteSignature> {
  <template>
    {{pageTitle (t "application.name")}}

    <Navbar />
    <PortalTarget class="z-[2001]" />

    {{outlet}}
  </template>
}
