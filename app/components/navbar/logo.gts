import { t } from 'ember-intl';

<template>
  <div class='flex flex-shrink-0 items-center'>
    <img
      class='h-8 w-auto'
      src='/images/logo.png'
      alt={{t 'application.name'}}
    />
    <span class='pl-2 hidden lg:inline'>
      {{t 'application.name'}}
    </span>
  </div>
</template>
