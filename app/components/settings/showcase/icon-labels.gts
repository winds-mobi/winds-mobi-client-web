import Thermometer from 'ember-phosphor-icons/components/ph-thermometer';
import Drop from 'ember-phosphor-icons/components/ph-drop';
import StationMetricCard from 'winds-mobi-client-web/components/station/metric-card';

export interface SettingsShowcaseIconLabelsSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// Two real StationMetricCards, side by side: with the preference on they
// shrink to icon + value and sit close together; off, they show the full
// text label and stretch to fill the row as they do today.
<template>
  <div
    class="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100 p-3"
    ...attributes
  >
    <StationMetricCard
      @format="temperature"
      @label="Temperature"
      @value={{24}}
      @icon={{if @enabled Thermometer}}
    />
    <StationMetricCard
      @format="humidity"
      @label="Humidity"
      @value={{56}}
      @icon={{if @enabled Drop}}
    />
  </div>
</template>
