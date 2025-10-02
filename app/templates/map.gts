import Map from 'winds-mobi-client-web/components/map';
import { Drawer } from '@frontile/overlays';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { action } from '@ember/object';
import Component from '@glimmer/component';

interface MyRouteSignature {
  Args: { model: string };
}

export default class MyRoute extends Component<MyRouteSignature> {
  @service declare router: RouterService;

  get isNotOnTop() {
    return this.router.currentRouteName !== 'map.index';
  }

  @action closeSidebar() {
    this.router.transitionTo('map.index');
  }

  <template>
    <div class="flex-1 min-h-64">
      <Map />
    </div>

    {{outlet}}
  </template>
}
