import Route from 'ember-route-template';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import Station from 'winds-mobi-client-web/components/station';

export default Route(<template><Station @stationId={{@model}} /></template>);
