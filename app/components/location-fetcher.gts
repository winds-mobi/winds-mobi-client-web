import { on } from '@ember/modifier';
import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { Button } from '@frontile/buttons';
import Gps from 'ember-phosphor-icons/components/ph-gps';
import GpsFix from 'ember-phosphor-icons/components/ph-gps-fix';
import GpsSlash from 'ember-phosphor-icons/components/ph-gps-slash';
import { ToggleButton } from '@frontile/buttons';
import { t } from 'ember-intl';
import type LocationService from 'winds-mobi-client-web/services/location';
import { inject as service } from '@ember/service';

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

export interface LocationFetcherSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class LocationFetcher extends Component<LocationFetcherSignature> {
  @service declare location: LocationService;

  <template>
    <ToggleButton
      type='button'
      @onChange={{this.location.getLocationTask.perform}}
      @isSelected={{if this.location.getLocationTask.last.value true false}}
      disabled={{this.location.getLocationTask.isRunning}}
      class='flex align-middle items-center gap-2'
    >
      {{log this.location.getLocationTask.last.isSuccessful}}
      {{log this.location.getLocationTask.last.value}}

      {{#if this.location.getLocationTask.last.value}}
        <GpsFix />
      {{else}}
        {{#if this.location.getLocationTask.last.isError}}
          <GpsSlash />
        {{else}}
          <Gps
            class={{if this.location.getLocationTask.isRunning 'animate-pulse'}}
          />
        {{/if}}
      {{/if}}

      <span class='hidden lg:inline'>
        {{t 'location-fetcher.center'}}
      </span>
    </ToggleButton>
  </template>
}
