import Component from '@glimmer/component';
import { service } from '@ember/service';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import Warning from 'ember-phosphor-icons/components/ph-warning';
import StationSectionCard from 'winds-mobi-client-web/components/station/section-card';
import SettingsRow from 'winds-mobi-client-web/components/settings/row';
import SettingsShowcaseFavicon from 'winds-mobi-client-web/components/settings/showcase/favicon';
import SettingsShowcaseGusts from 'winds-mobi-client-web/components/settings/showcase/gusts';
import SettingsShowcaseShrink from 'winds-mobi-client-web/components/settings/showcase/shrink';
import SettingsShowcaseNearbyCompactList from 'winds-mobi-client-web/components/settings/showcase/nearby-compact-list';
import SettingsShowcaseIconLabels from 'winds-mobi-client-web/components/settings/showcase/icon-labels';
import type SettingsService from 'winds-mobi-client-web/services/settings';

interface SettingsTemplateSignature {
  Args: {
    model: unknown;
  };
}

export default class SettingsTemplate extends Component<SettingsTemplateSignature> {
  @service declare settings: SettingsService;

  <template>
    {{pageTitle (t "settings.title")}}

    <section class="min-h-0 flex-1 overflow-y-auto bg-slate-200">
      <div
        class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        <StationSectionCard
          @title={{t "settings.betaFeaturesEnabled.label"}}
          @titleClass="sr-only"
          class="border-amber-300 bg-amber-50"
        >
          <SettingsRow @settings={{this.settings}} @name="betaFeaturesEnabled">
            <p
              class="flex items-start gap-1.5 text-sm font-bold text-amber-800"
            >
              <Warning @size={{18}} class="mt-0.5 shrink-0" />
              {{t "settings.betaFeaturesEnabled.warning"}}
            </p>
          </SettingsRow>
        </StationSectionCard>

        <StationSectionCard @title={{t "settings.title"}} @titleClass="sr-only">
          <p class="max-w-2xl text-sm leading-6 text-slate-600">
            {{t "settings.intro"}}
          </p>

          <dl class="mt-4 divide-y divide-slate-200">
            <SettingsRow
              @settings={{this.settings}}
              @name="faviconFollowsStation"
            >
              <SettingsShowcaseFavicon
                @enabled={{this.settings.faviconFollowsStation}}
              />
            </SettingsRow>

            <SettingsRow @settings={{this.settings}} @name="showGustsOutline">
              <SettingsShowcaseGusts
                @enabled={{this.settings.showGustsOutline}}
              />
            </SettingsRow>

            <SettingsRow @settings={{this.settings}} @name="shrinkOldData">
              <SettingsShowcaseShrink
                @enabled={{this.settings.shrinkOldData}}
              />
            </SettingsRow>

            <SettingsRow @settings={{this.settings}} @name="nearbyCompactList">
              <SettingsShowcaseNearbyCompactList
                @enabled={{this.settings.nearbyCompactList}}
              />
            </SettingsRow>

            <SettingsRow @settings={{this.settings}} @name="useIconLabels">
              <SettingsShowcaseIconLabels
                @enabled={{this.settings.useIconLabels}}
              />
            </SettingsRow>
          </dl>
        </StationSectionCard>
      </div>
    </section>
  </template>
}
