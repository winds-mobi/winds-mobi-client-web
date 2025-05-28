import Route from 'ember-route-template';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import Navbar from 'winds-mobi-client-web/components/navbar';

export default Route(
  <template>
    {{pageTitle (t "application.name")}}

    <Navbar />

    {{outlet}}
  </template>
);
