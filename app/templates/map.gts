import Route from 'ember-route-template';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import Map from 'winds-mobi-client-web/components/map';

export default Route(
  <template>
    <div class='flex-1 min-h-64'>
      <Map />
    </div>

    {{outlet}}
  </template>,
);
