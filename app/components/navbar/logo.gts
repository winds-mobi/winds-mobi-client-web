import { t } from 'ember-intl';

<template>
  <div class='flex flex-shrink-0 items-center'>
    <img
      class='h-8 w-auto'
      src='/images/windmobile.png'
      alt={{t 'application.name'}}
    />
    <span class='pl-2'>
      {{t 'application.name'}}
    </span>
  </div>
</template>
