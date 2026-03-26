import type { ComponentLike } from '@glint/template';

export interface StationMetaItemSignature {
  Args: {
    icon: ComponentLike<{
      Args: {
        size?: number;
      };
    }>;
    label: string;
  };
  Blocks: {
    default: [];
  };
  Element: HTMLDivElement;
}

<template>
  <div class="flex items-center gap-1.5">
    <dt class="sr-only">{{@label}}</dt>
    <dd class="m-0 inline-flex items-center gap-1.5" ...attributes>
      <@icon @size={{12}} class="text-slate-400" />
      {{yield}}
    </dd>
  </div>
</template>
