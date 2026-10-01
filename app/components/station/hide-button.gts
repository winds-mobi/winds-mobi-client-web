import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { Button } from 'frontile/buttons';
import { t } from 'ember-intl';
import Eye from 'ember-phosphor-icons/components/ph-eye';
import EyeSlash from 'ember-phosphor-icons/components/ph-eye-slash';
import type HiddenStationsService from 'winds-mobi-client-web/services/hidden-stations';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type { Station } from 'winds-mobi-client-web/services/store.js';

export interface StationHideButtonSignature {
  Args: {
    station: Station;
  };
  Element: null;
}

export default class StationHideButton extends Component<StationHideButtonSignature> {
  @service('hidden-stations') declare hiddenStations: HiddenStationsService;
  @service declare settings: SettingsService;

  // Hiding is a beta feature (see app/services/settings.ts): renders
  // nothing while it's off, so callers can render this unconditionally.
  get isEnabled(): boolean {
    return this.settings.betaFeatureOn('hiddenStationsFeatureEnabled');
  }

  get isHidden(): boolean {
    return this.hiddenStations.has(this.args.station.id);
  }

  @action
  handleToggleHidden() {
    this.hiddenStations.toggle(this.args.station.id);
  }

  <template>
    {{#if this.isEnabled}}
      <Button
        aria-label={{if
          this.isHidden
          (t "station.hide.remove")
          (t "station.hide.add")
        }}
        aria-pressed={{if this.isHidden "true" "false"}}
        data-test-station-hide
        @variant="plain"
        @size="xs"
        @onPress={{this.handleToggleHidden}}
      >
        {{! size-5! forces the icon past Frontile's own Button base class,
        matching StationFavoriteButton's own heart icon -- see its comment. }}
        {{#if this.isHidden}}
          <EyeSlash @size={{20}} class="size-5! text-slate-500" />
        {{else}}
          <Eye @size={{20}} class="size-5! text-slate-400" />
        {{/if}}
      </Button>
    {{/if}}
  </template>
}
