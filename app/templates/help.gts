import Component from '@glimmer/component';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import HelpChangelog from 'winds-mobi-client-web/components/help/changelog';
import HelpLiveStation from 'winds-mobi-client-web/components/help/live-station';
import MapLegend from 'winds-mobi-client-web/components/map/legend';
import StationSectionCard from 'winds-mobi-client-web/components/station/section-card';
import { readingFreshnessLegendBands } from 'winds-mobi-client-web/utils/reading-freshness';
import { windLegendBands } from 'winds-mobi-client-web/helpers/wind-to-colour';

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

  legendBands = windLegendBands();
  freshnessLegendBands = readingFreshnessLegendBands();

  <template>
    {{pageTitle (t "help.title")}}

    <section class="min-h-0 flex-1 overflow-y-auto bg-slate-200">
      <div
        class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        <StationSectionCard @title={{t "help.title"}} @titleClass="sr-only">
          <div class="grid gap-3">
            <p class="max-w-3xl text-sm leading-6 text-slate-600">
              {{t "help.intro"}}
            </p>
            <dl class="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
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
                    "navigation.favorites"
                  }}</dt>
                <dd class="mt-1">{{t "help.sections.favoritesDescription"}}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">{{t
                    "navigation.settings"
                  }}</dt>
                <dd class="mt-1">{{t "help.sections.settingsDescription"}}</dd>
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

        <div class="grid gap-6 lg:grid-cols-3">
          <StationSectionCard @title={{t "help.colors.title"}}>
            <div class="grid gap-4">
              <p class="text-sm leading-6 text-slate-600">
                {{t "help.colors.description"}}
              </p>
              <div class="relative min-h-32 rounded-lg bg-slate-50 p-4">
                <MapLegend
                  class="relative"
                  @bands={{this.legendBands}}
                  @title={{t "map.legend.windSpeed"}}
                />
              </div>
            </div>
          </StationSectionCard>

          <StationSectionCard @title={{t "help.freshness.title"}}>
            <div class="grid gap-4">
              <p class="text-sm leading-6 text-slate-600">
                {{t "help.freshness.description"}}
              </p>
              <div
                class="relative min-h-32 rounded-lg bg-slate-50 p-4"
                data-test-help-freshness-legend
              >
                <p
                  class="mb-2 text-[10px] font-semibold uppercase leading-tight tracking-[0.1em] text-slate-500"
                >
                  {{t "station.meta.updated"}}
                </p>
                <ul class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {{#each this.freshnessLegendBands as |band|}}
                    <li class="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        class="size-3 shrink-0 rounded-full ring-1 ring-black/10
                          {{band.backgroundClass}}"
                      ></span>
                      <span class="text-xs text-slate-600">{{band.label}}</span>
                    </li>
                  {{/each}}
                </ul>
              </div>
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

        <StationSectionCard @title={{t "help.faq.title"}}>
          <div class="grid gap-3 text-sm leading-6 text-slate-600">
            <dl class="grid gap-3 text-sm text-slate-700">
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">{{t
                    "help.faq.items.whyQuestion"
                  }}</dt>
                <dd class="mt-1">{{t "help.faq.items.whyAnswer"}}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">{{t
                    "help.faq.items.feelQuestion"
                  }}</dt>
                <dd class="mt-1">{{t "help.faq.items.feelAnswer"}}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">{{t
                    "help.faq.items.costQuestion"
                  }}</dt>
                <dd class="mt-1">{{t "help.faq.items.costAnswer"}}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3" data-test-help-faq-sosm>
                <dt class="font-semibold text-slate-950">{{t
                    "help.faq.items.fixQuestion"
                  }}</dt>
                <dd class="mt-1">
                  <p>{{t "help.faq.items.fixAnswer"}}</p>
                  <a
                    class="mt-1 inline-block underline decoration-slate-300 underline-offset-3 hover:text-slate-900 hover:decoration-slate-500"
                    href="https://sosm.ch/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    sosm.ch
                  </a>
                </dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">{{t
                    "help.faq.items.futureQuestion"
                  }}</dt>
                <dd class="mt-1">{{t "help.faq.items.futureAnswer"}}</dd>
              </div>
            </dl>
          </div>
        </StationSectionCard>

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
              <div class="rounded-lg bg-slate-50 p-3" data-test-help-community>
                <dt class="font-semibold text-slate-950">{{t
                    "help.about.communityTitle"
                  }}</dt>
                <dd class="mt-1 flex items-start gap-3">
                  <img
                    alt=""
                    src="/discord-invite-qr.svg"
                    class="size-16 shrink-0 rounded bg-white p-1 ring-1 ring-slate-200"
                  />
                  <span>
                    {{t "help.about.communityDescription"}}
                    <a
                      data-test-help-discord-link
                      class="block underline decoration-slate-300 underline-offset-3 hover:text-slate-900 hover:decoration-slate-500"
                      href="https://discord.gg/6VU23xDv5v"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      discord.gg/6VU23xDv5v
                    </a>
                  </span>
                </dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3">
                <dt class="font-semibold text-slate-950">{{t
                    "help.about.repoTitle"
                  }}</dt>
                <dd class="mt-1">
                  <p>{{t "help.about.repoDescription"}}</p>
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

        <StationSectionCard @title={{t "help.changelog.title"}}>
          <div class="grid gap-4">
            <p class="text-sm leading-6 text-slate-600">
              {{t "help.changelog.description"}}
            </p>
            <HelpChangelog />
          </div>
        </StationSectionCard>
      </div>
    </section>
  </template>
}
