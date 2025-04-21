import Route from 'ember-route-template';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';

export default Route(<template>{{pageTitle (t 'Summary')}}</template>);
