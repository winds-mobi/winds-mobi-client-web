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
import SettingsShowcaseCompactList from 'winds-mobi-client-web/components/settings/showcase/compact-list';
import SettingsShowcaseIconLabels from 'winds-mobi-client-web/components/settings/showcase/icon-labels';
import SettingsShowcaseRefreshSpin from 'winds-mobi-client-web/components/settings/showcase/refresh-spin';
import SettingsShowcaseFavorites from 'winds-mobi-client-web/components/settings/showcase/favorites';
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
        <p class="max-w-2xl text-sm leading-6 text-slate-600">
          {{t "settings.intro"}}
        </p>

        {{! Each preference is its own card so the box itself makes the
          grouping obvious — no separator styling needed between them. }}
        <div class="grid gap-3 sm:gap-4">
          <StationSectionCard
            @title={{t "settings.faviconFollowsStation.label"}}
            @titleClass="sr-only"
          >
            <SettingsRow
              @settings={{this.settings}}
              @name="faviconFollowsStation"
            >
              <SettingsShowcaseFavicon
                @enabled={{this.settings.faviconFollowsStation}}
              />
            </SettingsRow>
          </StationSectionCard>

          <StationSectionCard
            @title={{t "settings.showGustsOutline.label"}}
            @titleClass="sr-only"
          >
            <SettingsRow @settings={{this.settings}} @name="showGustsOutline">
              <SettingsShowcaseGusts
                @enabled={{this.settings.showGustsOutline}}
              />
            </SettingsRow>
          </StationSectionCard>

          <StationSectionCard
            @title={{t "settings.shrinkOldData.label"}}
            @titleClass="sr-only"
          >
            <SettingsRow @settings={{this.settings}} @name="shrinkOldData">
              <SettingsShowcaseShrink
                @enabled={{this.settings.shrinkOldData}}
              />
            </SettingsRow>
          </StationSectionCard>

          <StationSectionCard
            @title={{t "settings.nearbyCompactList.label"}}
            @titleClass="sr-only"
          >
            <SettingsRow @settings={{this.settings}} @name="nearbyCompactList">
              <SettingsShowcaseCompactList
                @enabled={{this.settings.nearbyCompactList}}
              />
            </SettingsRow>
          </StationSectionCard>

          <StationSectionCard
            @title={{t "settings.favoritesCompactList.label"}}
            @titleClass="sr-only"
          >
            <SettingsRow
              @settings={{this.settings}}
              @name="favoritesCompactList"
            >
              <SettingsShowcaseCompactList
                @enabled={{this.settings.favoritesCompactList}}
              />
            </SettingsRow>
          </StationSectionCard>

          <StationSectionCard
            @title={{t "settings.useIconLabels.label"}}
            @titleClass="sr-only"
          >
            <SettingsRow @settings={{this.settings}} @name="useIconLabels">
              <SettingsShowcaseIconLabels
                @enabled={{this.settings.useIconLabels}}
              />
            </SettingsRow>
          </StationSectionCard>

          {{! Every beta feature lives in this one visually distinguished
            (amber) container: the master toggle always sits above the
            individual beta features it reveals, so the toggle that causes
            them to appear is never below its own effects. Add a new beta
            feature's own toggle here, inside this same card, rather than as
            a separate top-level StationSectionCard. }}
          <StationSectionCard
            @title={{t "settings.betaFeaturesEnabled.groupLabel"}}
            @titleClass="sr-only"
            class="border-amber-300 bg-amber-50"
          >
            <div class="flex flex-col gap-3">
              <SettingsRow
                @settings={{this.settings}}
                @name="betaFeaturesEnabled"
              >
                <p
                  class="flex items-start gap-1.5 text-sm font-bold text-amber-800"
                >
                  <Warning @size={{18}} class="mt-0.5 shrink-0" />
                  {{t "settings.betaFeaturesEnabled.warning"}}
                </p>
              </SettingsRow>

              {{#if this.settings.betaFeaturesEnabled}}
                <SettingsRow
                  @settings={{this.settings}}
                  @name="favoritesFeatureEnabled"
                  class="border-t border-amber-200 pt-3"
                >
                  <SettingsShowcaseFavorites
                    @enabled={{this.settings.favoritesFeatureEnabled}}
                  />
                </SettingsRow>

                <SettingsRow
                  @settings={{this.settings}}
                  @name="refreshButtonSpin"
                  class="border-t border-amber-200 pt-3"
                >
                  <SettingsShowcaseRefreshSpin
                    @enabled={{this.settings.refreshButtonSpin}}
                  />
                </SettingsRow>
              {{/if}}
            </div>
          </StationSectionCard>
        </div>
      </div>
    </section>
  </template>
}
