import Map from 'winds-mobi-client-web/components/map';
import Component from '@glimmer/component';

interface MyRouteSignature {
  Args: { model: string };
}

export default class MyRoute extends Component<MyRouteSignature> {
  <template>
    <div class="flex-1 min-h-64">
      <Map />
    </div>

    {{outlet}}
  </template>
}
