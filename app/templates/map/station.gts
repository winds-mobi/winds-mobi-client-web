import { pageTitle } from 'ember-page-title';
import { Request } from '@warp-drive/ember';
import Station from 'winds-mobi-client-web/components/station';
import Component from '@glimmer/component';
import type { MapStationRouteModel } from 'winds-mobi-client-web/routes/map/station';

interface MapStationTemplateSignature {
  Args: { model: MapStationRouteModel };
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class MapStationTemplate extends Component<MapStationTemplateSignature> {
  <template>
    <Request @request={{@model.stationRequest}}>
      <:content as |stationResult|>
        {{pageTitle stationResult.data.name}}

        <Request @request={{@model.historyRequest}}>
          <:content as |historyResult|>
            <Station
              @station={{stationResult.data}}
              @history={{historyResult.data}}
            />
          </:content>
        </Request>
      </:content>
    </Request>
  </template>
}
