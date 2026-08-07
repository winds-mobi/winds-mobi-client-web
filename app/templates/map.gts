import Map from 'winds-mobi-client-web/components/map';
import Component from '@glimmer/component';

interface MyRouteSignature {
  Args: { model: string };
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class MyRoute extends Component<MyRouteSignature> {
  <template>
    {{! The station panel is rendered into the map's own overlay slot rather than
    beside the map: a sibling panel shrinks the map's box, and MapLibre keeps its
    geographic centre through a resize, so the same coordinates land on a
    different pixel and the whole map appears to lurch (#155). }}
    <div class="min-h-0 flex-1 overflow-hidden bg-white">
      <Map>
        {{outlet}}
      </Map>
    </div>
  </template>
}
