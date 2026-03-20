import Map from 'winds-mobi-client-web/components/map';
import Component from '@glimmer/component';

interface MyRouteSignature {
  Args: { model: string };
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class MyRoute extends Component<MyRouteSignature> {
  <template>
    <div class="relative flex-1 min-h-64 overflow-hidden">
      <Map />

      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-stretch md:inset-0 md:justify-start md:p-4"
      >
        {{outlet}}
      </div>
    </div>
  </template>
}
