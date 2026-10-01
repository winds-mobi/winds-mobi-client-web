import Component from '@glimmer/component';
import { TabNav } from 'frontile/navigation';
import type { TabNavArgs } from 'frontile/navigation';
import { t } from 'ember-intl';
import { NAVBAR_SURFACE_ITEMS, NAVBAR_UTILITY_ITEMS } from './items';

export interface NavbarMenuLinksSignature {
  Args: {
    variant: 'desktop' | 'mobile';
    // Which group of links to render: the station surfaces, or everything
    // that isn't one. They are separate TabNavs so each reads as its own set
    // of choices, with its own selection indicator.
    group: 'surfaces' | 'utilities';
  };
  Element: null;
}

// The desktop navbar and the mobile drawer render the same links through the
// same TabNav -- see navbar/menu/desktop.gts and navbar/menu/mobile.gts, which
// pick the variant and the group.
export default class NavbarMenuLinks extends Component<NavbarMenuLinksSignature> {
  get visibleItems() {
    return this.args.group === 'utilities'
      ? NAVBAR_UTILITY_ITEMS
      : NAVBAR_SURFACE_ITEMS;
  }

  get isMobile(): boolean {
    return this.args.variant === 'mobile';
  }

  get orientation(): 'horizontal' | 'vertical' {
    return this.isMobile ? 'vertical' : 'horizontal';
  }

  // Mobile: left-align the label/icon (TabNav's own default centers them,
  // which reads fine in a horizontal pill nav but not in a vertical list)
  // and give each item breathing room: py- so the text itself isn't
  // cramped against its own top/bottom edge, and a gap on the list so the
  // selection indicator (sized to match each tab's own box) has visible
  // space above/below it rather than touching its neighbours. The list's
  // own soft-tinted track background becomes plain white, and each
  // inactive item gets a border to stay visually separated without it
  // (border-transparent on the active
  // item keeps its box the same size, so nothing shifts on select).
  //
  // Desktop: TabNav's stock "md" size renders at ~18.2px/semibold (its own
  // modular type scale), noticeably larger/heavier than the rest of this
  // navbar's text -- sized down and un-bolded to match.
  get classes(): TabNavArgs['classes'] | undefined {
    return this.isMobile
      ? {
          list: 'gap-1.5 bg-white',
          tab: 'justify-start py-2.5 border border-transparent data-[selected=false]:border-slate-200',
        }
      : { tab: 'text-sm font-normal' };
  }

  <template>
    <TabNav
      @label={{t "navigation.menu"}}
      @color="primary"
      @orientation={{this.orientation}}
      @isFullWidth={{this.isMobile}}
      @classes={{this.classes}}
      as |nav|
    >
      {{#each this.visibleItems as |item|}}
        <nav.Item @route={{item.route}} data-test-navbar-link={{item.route}}>
          <item.icon @size={{16}} />
          {{t item.labelKey}}
        </nav.Item>
      {{/each}}
    </TabNav>
  </template>
}
