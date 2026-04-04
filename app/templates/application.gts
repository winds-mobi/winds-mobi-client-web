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

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-200">
      <Navbar />
      <PortalTarget class="z-[2001]" />

      <main class="min-h-0 flex flex-1 flex-col">
        {{outlet}}
      </main>
    </div>
  </template>
}
