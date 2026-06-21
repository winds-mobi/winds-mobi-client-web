import type { ComponentLike } from '@glint/template';

// Shared shape for the `@icon` arg accepted by StationMetaItem,
// StationMetricCard, and the navbar menu items: any ember-phosphor-icons
// component, which all take an optional `size`.
export type IconComponent = ComponentLike<{
  Args: {
    size?: number;
  };
}>;
