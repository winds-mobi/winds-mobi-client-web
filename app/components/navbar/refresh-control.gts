import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { Button } from '@frontile/buttons';
import { t } from 'ember-intl';
import type { IntlService } from 'ember-intl';
import ArrowClockwise from 'ember-phosphor-icons/components/ph-arrow-clockwise';
import type MapRefreshService from 'winds-mobi-client-web/services/map-refresh';

export interface NavbarRefreshControlSignature {
  Args: {
    isFullWidth?: boolean;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class NavbarRefreshControl extends Component<NavbarRefreshControlSignature> {
  @service declare mapRefresh: MapRefreshService;
  @service declare intl: IntlService;

  get buttonClass() {
    if (this.args.isFullWidth) {
      return 'w-full justify-start';
    }

    return 'size-10 p-0';
  }

  get elapsedLabel() {
    const totalSeconds = Math.floor(this.mapRefresh.elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  get title() {
    const ariaLabel = String(this.intl.t('map.refresh.ariaLabel'));

    return `${ariaLabel} (${this.intl.t('map.refresh.sinceLast', {
      value: this.elapsedLabel,
    })})`;
  }

  @action
  handleRefresh() {
    this.mapRefresh.refreshNow();
  }

  <template>
    <Button
      aria-label={{this.title}}
      data-test-navbar-refresh
      @appearance="outlined"
      @class={{this.buttonClass}}
      title={{this.title}}
      @onPress={{this.handleRefresh}}
    >
      <span class="inline-flex items-center gap-2">
        <ArrowClockwise @size={{14}} />
        {{#if @isFullWidth}}
          <span>{{t "map.refresh.label"}}</span>
        {{/if}}
      </span>
    </Button>
  </template>
}
