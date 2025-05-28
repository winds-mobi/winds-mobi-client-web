import Route from 'ember-route-template';
import Station from 'winds-mobi-client-web/components/station';

export default Route(<template><Station @stationId={{@model}} /></template>);
