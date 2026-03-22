import Map from 'winds-mobi-client-web/components/map';
import Component from '@glimmer/component';

interface MyRouteSignature {
  Args: { model: string };
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class MyRoute extends Component<MyRouteSignature> {
  <template>
    <div
      class="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-200 md:flex-row-reverse"
    >
      <div class="min-h-[18rem] min-w-0 flex-1 bg-white md:min-h-0">
        <Map />
      </div>

      {{outlet}}
    </div>
  </template>
}
