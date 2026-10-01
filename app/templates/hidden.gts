import Component from '@glimmer/component';
import { service } from '@ember/service';
import StationIdListPage from 'winds-mobi-client-web/components/station/id-list-page';
import type HiddenStationsService from 'winds-mobi-client-web/services/hidden-stations';

interface HiddenTemplateSignature {
  Args: {
    model: unknown;
  };
}

export default class HiddenTemplate extends Component<HiddenTemplateSignature> {
  @service('hidden-stations') declare hiddenStations: HiddenStationsService;

  <template>
    <StationIdListPage
      @surface="hidden"
      @stationIds={{this.hiddenStations.stationIds}}
    />
  </template>
}
