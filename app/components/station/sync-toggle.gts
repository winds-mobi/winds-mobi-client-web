import { Switch } from '@frontile/forms';
import { t } from 'ember-intl';
import LockSimple from 'ember-phosphor-icons/components/ph-lock-simple';
import LockSimpleOpen from 'ember-phosphor-icons/components/ph-lock-simple-open';

export interface StationSyncToggleSignature {
  Args: {
    isSelected: boolean;
    onChange: (value: boolean) => void;
  };
  Element: HTMLInputElement;
}

// The wind/air graph "Sync" switch, shared by the station detail panel and the
// settings preview so both render the exact same control.
<template>
  <Switch
    @isSelected={{@isSelected}}
    @onChange={{@onChange}}
    @intent="success"
    @label={{t "station.timeSeries.sync"}}
    aria-label={{t "station.timeSeries.syncToggle"}}
    ...attributes
  >
    <:startContent>
      <LockSimple @size={{14}} />
    </:startContent>

    <:endContent>
      <LockSimpleOpen @size={{14}} />
    </:endContent>
  </Switch>
</template>
