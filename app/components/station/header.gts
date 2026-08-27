import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { LinkTo } from '@ember/routing';
import { Button } from '@frontile/buttons';
import { t } from 'ember-intl';
import Heart from 'ember-phosphor-icons/components/ph-heart';
import Bell from 'ember-phosphor-icons/components/ph-bell';
import BellRinging from 'ember-phosphor-icons/components/ph-bell-ringing';
import AlarmSettingsModal from 'winds-mobi-client-web/components/alarm/settings-modal';
import type AlarmsService from 'winds-mobi-client-web/services/alarms';
import type FavoritesService from 'winds-mobi-client-web/services/favorites';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type { Station } from 'winds-mobi-client-web/services/store.js';
import { focusQueryParamsFor } from 'winds-mobi-client-web/utils/map-view';

export interface StationHeaderSignature {
  Args: {
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationHeader extends Component<StationHeaderSignature> {
  @service declare alarms: AlarmsService;
  @service declare favorites: FavoritesService;
  @service declare settings: SettingsService;

  @tracked isAlarmModalOpen = false;

  // Favouriting is a beta feature (see app/services/settings.ts): hidden
  // until beta is opted into *and* the favourites feature's own toggle is on.
  // No account is required — favourites persist locally (see
  // app/services/favorites.ts).
  get showFavoriteControl(): boolean {
    return (
      this.settings.betaFeaturesEnabled && this.settings.favoritesFeatureEnabled
    );
  }

  get isFavorite(): boolean {
    return this.favorites.has(this.args.station.id);
  }

  @action
  handleToggleFavorite() {
    this.favorites.toggle(this.args.station.id);
  }

  // Wind alarms are a beta feature (see app/services/settings.ts), same
  // gating shape as favourites, and equally account-free (see
  // app/services/alarms.ts).
  get showAlarmControl(): boolean {
    return (
      this.settings.betaFeaturesEnabled && this.settings.alarmsFeatureEnabled
    );
  }

  get hasAlarm(): boolean {
    return this.alarms.has(this.args.station.id);
  }

  get isAlarmTriggered(): boolean {
    return this.alarms.triggeredStationIds.has(this.args.station.id);
  }

  // Plain outline bell when unarmed; a ringing amber bell (filled) once
  // armed — whether or not it's currently triggered. The "actively
  // triggered" signal lives on the whole card/panel and the map marker
  // instead (see `--color-alarm` in app/styles/app.css), not on this icon.
  get alarmIcon() {
    return this.hasAlarm ? BellRinging : Bell;
  }

  get alarmIconClass(): string {
    return this.hasAlarm ? 'text-amber-400' : 'text-slate-400';
  }

  @action
  openAlarmModal() {
    this.isAlarmModalOpen = true;
  }

  @action
  closeAlarmModal() {
    this.isAlarmModalOpen = false;
  }

  <template>
    <div class="flex min-w-0 items-start gap-2">
      {{#if this.showFavoriteControl}}
        <Button
          aria-label={{if
            this.isFavorite
            (t "station.favorite.remove")
            (t "station.favorite.add")
          }}
          aria-pressed={{if this.isFavorite "true" "false"}}
          data-test-station-favorite
          @appearance="minimal"
          @size="xs"
          @onPress={{this.handleToggleFavorite}}
        >
          <Heart
            @size={{20}}
            @weight={{if this.isFavorite "fill" "regular"}}
            class={{if this.isFavorite "text-rose-500" "text-slate-400"}}
          />
        </Button>
      {{/if}}

      {{#if this.showAlarmControl}}
        {{! The "alarming" glow lives on the whole card/panel (see
          utils/alarm-color.ts), so it's visible even where this bell
          isn't rendered at all (station/compact-card.gts). The bell itself
          only distinguishes unarmed (outline/grey) from armed
          (filled/ringing amber) — it does not change again once triggered. }}
        <Button
          aria-label={{t "station.alarm.open"}}
          aria-pressed={{if this.hasAlarm "true" "false"}}
          data-test-station-alarm
          data-test-station-alarm-triggered={{if this.isAlarmTriggered "true"}}
          @appearance="minimal"
          @size="xs"
          @onPress={{this.openAlarmModal}}
        >
          <this.alarmIcon
            @size={{20}}
            @weight={{if this.hasAlarm "fill" "regular"}}
            class={{this.alarmIconClass}}
          />
        </Button>

        {{#if this.isAlarmModalOpen}}
          <AlarmSettingsModal
            @station={{@station}}
            @isOpen={{this.isAlarmModalOpen}}
            @onClose={{this.closeAlarmModal}}
          />
        {{/if}}
      {{/if}}

      <h2 class="min-w-0 flex-1">
        <LinkTo
          data-test-station-title
          @route="map.station"
          @model={{@station.id}}
          @query={{focusQueryParamsFor @station}}
          title={{t "station.showOnMap"}}
          class="block truncate text-xl font-bold text-slate-950 underline decoration-transparent underline-offset-3 transition hover:decoration-slate-300"
        >
          {{@station.name}}
        </LinkTo>
      </h2>
    </div>
  </template>
}
