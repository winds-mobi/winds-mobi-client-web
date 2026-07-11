import type { ComponentLike } from '@glint/template';

// Shared shape for the `@icon` arg accepted by StationMetaItem,
// StationMetricCard, and the navbar menu items: any ember-phosphor-icons
// component. Mirrors PhIcon's own signature surface that consumers rely on —
// `size` (which phosphor accepts as number or CSS-unit string) and an SVG
// root element so callers can splat classes onto it.
export type IconComponent = ComponentLike<{
  Args: {
    size?: string | number;
  };
  Element: SVGElement;
}>;
