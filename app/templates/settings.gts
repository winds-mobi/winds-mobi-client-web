import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import { Switch } from '@frontile/forms';
import StationSectionCard from 'winds-mobi-client-web/components/station/section-card';
import SettingsShowcaseFavicon from 'winds-mobi-client-web/components/settings/showcase/favicon';
import SettingsShowcaseGusts from 'winds-mobi-client-web/components/settings/showcase/gusts';
import SettingsShowcaseFade from 'winds-mobi-client-web/components/settings/showcase/fade';
import SettingsShowcaseGraphSync from 'winds-mobi-client-web/components/settings/showcase/graph-sync';
import type SettingsService from 'winds-mobi-client-web/services/settings';

interface SettingsTemplateSignature {
  Args: {
    model: unknown;
  };
}

export default class SettingsTemplate extends Component<SettingsTemplateSignature> {
  @service declare settings: SettingsService;

  @action
  setFaviconFollowsStation(value: boolean) {
    this.settings.faviconFollowsStation = value;
  }

  @action
  setShowGustsOutline(value: boolean) {
    this.settings.showGustsOutline = value;
  }

  @action
  setFadeOldData(value: boolean) {
    this.settings.fadeOldData = value;
  }

  @action
  setSyncGraphsByDefault(value: boolean) {
    this.settings.syncGraphsByDefault = value;
  }

  <template>
    {{pageTitle (t "settings.title")}}

    <section class="min-h-0 flex-1 overflow-y-auto bg-slate-200">
      <div
        class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        <StationSectionCard @title={{t "settings.title"}} @titleClass="sr-only">
          <p class="max-w-2xl text-sm leading-6 text-slate-600">
            {{t "settings.intro"}}
          </p>

          <dl class="mt-4 divide-y divide-slate-200">
            <div
              class="grid items-center gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_14rem]"
            >
              <div>
                <Switch
                  data-test-setting="faviconFollowsStation"
                  @isSelected={{this.settings.faviconFollowsStation}}
                  @onChange={{this.setFaviconFollowsStation}}
                  @intent="success"
                  @label={{t "settings.faviconFollowsStation.label"}}
                  @description={{t
                    "settings.faviconFollowsStation.description"
                  }}
                />
              </div>
              <SettingsShowcaseFavicon
                @enabled={{this.settings.faviconFollowsStation}}
              />
            </div>

            <div
              class="grid items-center gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_14rem]"
            >
              <div>
                <Switch
                  data-test-setting="showGustsOutline"
                  @isSelected={{this.settings.showGustsOutline}}
                  @onChange={{this.setShowGustsOutline}}
                  @intent="success"
                  @label={{t "settings.showGustsOutline.label"}}
                  @description={{t "settings.showGustsOutline.description"}}
                />
              </div>
              <SettingsShowcaseGusts
                @enabled={{this.settings.showGustsOutline}}
              />
            </div>

            <div
              class="grid items-center gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_14rem]"
            >
              <div>
                <Switch
                  data-test-setting="fadeOldData"
                  @isSelected={{this.settings.fadeOldData}}
                  @onChange={{this.setFadeOldData}}
                  @intent="success"
                  @label={{t "settings.fadeOldData.label"}}
                  @description={{t "settings.fadeOldData.description"}}
                />
              </div>
              <SettingsShowcaseFade @enabled={{this.settings.fadeOldData}} />
            </div>

            <div
              class="grid items-center gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_14rem]"
            >
              <div>
                <Switch
                  data-test-setting="syncGraphsByDefault"
                  @isSelected={{this.settings.syncGraphsByDefault}}
                  @onChange={{this.setSyncGraphsByDefault}}
                  @intent="success"
                  @label={{t "settings.syncGraphsByDefault.label"}}
                  @description={{t "settings.syncGraphsByDefault.description"}}
                />
              </div>
              <SettingsShowcaseGraphSync
                @enabled={{this.settings.syncGraphsByDefault}}
                @onChange={{this.setSyncGraphsByDefault}}
              />
            </div>
          </dl>
        </StationSectionCard>
      </div>
    </section>
  </template>
}
