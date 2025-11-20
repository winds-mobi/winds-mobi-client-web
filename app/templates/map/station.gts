import Station from 'winds-mobi-client-web/components/station';
import Component from '@glimmer/component';

interface MyRouteSignature {
  Args: { model: string };
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class MyRoute extends Component<MyRouteSignature> {
  <template><Station @stationId={{@model}} /></template>
}
