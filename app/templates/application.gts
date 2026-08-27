import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import Navbar from 'winds-mobi-client-web/components/navbar';
import AlarmWatcher from 'winds-mobi-client-web/components/alarm/watcher';
import { PortalTarget } from '@frontile/overlays';

<template>
  {{pageTitle (t "application.name")}}

  <div class="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-200">
    <Navbar />
    <PortalTarget class="z-[2001]" />
    <AlarmWatcher />

    <main class="min-h-0 flex flex-1 flex-col">
      {{outlet}}
    </main>
  </div>
</template>
