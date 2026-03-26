import Component from '@glimmer/component';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import HelpLiveStation from 'winds-mobi-client-web/components/help/live-station';
import StationSectionCard from 'winds-mobi-client-web/components/station/section-card';

interface HelpTemplateSignature {
  Args: {
    model: unknown;
  };
}

const PROVIDERS = [
  'Born to Fly',
  'FFVL',
  'Fluggruppe Aletsch',
  'Holfuy',
  'IWeathar',
  'MeteoSwiss',
  'NOAA Metar',
  'OpenWindMap',
  'ROMMA',
  'Windline',
  'Windspots',
];

export default class HelpTemplate extends Component<HelpTemplateSignature> {
  providers = PROVIDERS;

  <template>
    {{pageTitle (t "help.title")}}

    <section class="min-h-0 flex-1 overflow-y-auto bg-slate-200">
      <div
        class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        <StationSectionCard @title={{t "help.title"}}>
          <div class="grid gap-3">
            <p class="max-w-3xl text-sm leading-6 text-slate-600">
              {{t "help.intro"}}
            </p>
            <dl class="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">{{t
                    "navigation.map"
                  }}</dt>
                <dd class="mt-1">{{t "help.sections.mapDescription"}}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">{{t
                    "navigation.nearby"
                  }}</dt>
                <dd class="mt-1">{{t "help.sections.nearbyDescription"}}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">{{t
                    "help.sections.sharedToolsTitle"
                  }}</dt>
                <dd class="mt-1">{{t
                    "help.sections.sharedToolsDescription"
                  }}</dd>
              </div>
            </dl>
          </div>
        </StationSectionCard>

        <div
          class="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)]"
        >
          <StationSectionCard @title={{t "help.liveExample.title"}}>
            <div class="grid gap-4">
              <p class="text-sm leading-6 text-slate-600">
                {{t "help.liveExample.description"}}
              </p>
              <HelpLiveStation @stationId="holfuy-1804" />
            </div>
          </StationSectionCard>

          <StationSectionCard @title={{t "help.liveExample.legendTitle"}}>
            <dl class="grid gap-3 text-sm text-slate-700">
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">
                  {{t "help.liveExample.items.headerTitle"}}
                </dt>
                <dd class="mt-1">{{t
                    "help.liveExample.items.headerDescription"
                  }}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">
                  {{t "help.liveExample.items.nowTitle"}}
                </dt>
                <dd class="mt-1">{{t
                    "help.liveExample.items.nowDescription"
                  }}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">
                  {{t "help.liveExample.items.lastHourTitle"}}
                </dt>
                <dd class="mt-1">{{t
                    "help.liveExample.items.lastHourDescription"
                  }}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">
                  {{t "help.liveExample.items.windHistoryTitle"}}
                </dt>
                <dd class="mt-1">{{t
                    "help.liveExample.items.windHistoryDescription"
                  }}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">
                  {{t "help.liveExample.items.airHistoryTitle"}}
                </dt>
                <dd class="mt-1">{{t
                    "help.liveExample.items.airHistoryDescription"
                  }}</dd>
              </div>
            </dl>
          </StationSectionCard>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <StationSectionCard @title={{t "help.colors.title"}}>
            <div class="grid gap-4">
              <p class="text-sm leading-6 text-slate-600">
                {{t "help.colors.description"}}
              </p>
              <dl class="grid gap-2 text-sm text-slate-700">
                <div class="rounded-lg bg-slate-50 p-3">
                  <dt class="font-semibold text-slate-950">{{t
                      "help.colors.items.fillTitle"
                    }}</dt>
                  <dd class="mt-1">{{t
                      "help.colors.items.fillDescription"
                    }}</dd>
                </div>
                <div class="rounded-lg bg-slate-50 p-3">
                  <dt class="font-semibold text-slate-950">{{t
                      "help.colors.items.outlineTitle"
                    }}</dt>
                  <dd class="mt-1">{{t
                      "help.colors.items.outlineDescription"
                    }}</dd>
                </div>
                <div class="rounded-lg bg-slate-50 p-3">
                  <dt class="font-semibold text-slate-950">{{t
                      "help.colors.items.staleTitle"
                    }}</dt>
                  <dd class="mt-1">{{t
                      "help.colors.items.staleDescription"
                    }}</dd>
                </div>
              </dl>
            </div>
          </StationSectionCard>

          <StationSectionCard @title={{t "help.providers.title"}}>
            <div class="grid gap-4">
              <p class="text-sm leading-6 text-slate-600">
                {{t "help.providers.description"}}
              </p>
              <ul class="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                {{#each this.providers as |provider|}}
                  <li class="rounded-lg bg-slate-50 px-3 py-2">{{provider}}</li>
                {{/each}}
              </ul>
            </div>
          </StationSectionCard>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <StationSectionCard @title={{t "help.compatibility.title"}}>
            <p class="text-sm leading-6 text-slate-600">
              {{t "help.compatibility.description"}}
            </p>
          </StationSectionCard>

          <StationSectionCard @title={{t "help.privacy.title"}}>
            <p class="text-sm leading-6 text-slate-600">
              {{t "help.privacy.description"}}
            </p>
          </StationSectionCard>
        </div>

        <StationSectionCard @title={{t "help.about.title"}}>
          <div class="grid gap-3 text-sm leading-6 text-slate-600">
            <p>{{t "help.about.description"}}</p>
            <dl class="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">{{t
                    "help.about.teamTitle"
                  }}</dt>
                <dd class="mt-1">{{t "help.about.teamValue"}}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">{{t
                    "help.about.emailTitle"
                  }}</dt>
                <dd class="mt-1">
                  <a
                    class="underline decoration-slate-300 underline-offset-3 hover:text-slate-900 hover:decoration-slate-500"
                    href="mailto:info@winds.mobi"
                  >
                    info@winds.mobi
                  </a>
                </dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">{{t
                    "help.about.repoTitle"
                  }}</dt>
                <dd class="mt-1">
                  <a
                    class="underline decoration-slate-300 underline-offset-3 hover:text-slate-900 hover:decoration-slate-500"
                    href="https://github.com/winds-mobi/winds-mobi-client-web"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    github.com/winds-mobi/winds-mobi-client-web
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </StationSectionCard>
      </div>
    </section>
  </template>
}
