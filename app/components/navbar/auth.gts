import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { Dropdown } from '@frontile/collections';
import { getRequestState } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import { t } from 'ember-intl';
import FacebookLogo from 'ember-phosphor-icons/components/ph-facebook-logo';
import GoogleLogo from 'ember-phosphor-icons/components/ph-google-logo';
import SignOut from 'ember-phosphor-icons/components/ph-sign-out';
import Star from 'ember-phosphor-icons/components/ph-star';
import User from 'ember-phosphor-icons/components/ph-user';
import { profileQuery } from 'winds-mobi-client-web/builders/profile';
import type SessionService from 'winds-mobi-client-web/services/session';
import type {
  Profile,
  StoreService,
} from 'winds-mobi-client-web/services/store';
import { responseData } from 'winds-mobi-client-web/utils/request-response';
import { signInUrl } from 'winds-mobi-client-web/utils/user-api';

export interface NavbarAuthSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class NavbarAuth extends Component<NavbarAuthSignature> {
  @service declare router: RouterService;
  @service declare session: SessionService;
  @service declare store: StoreService;

  @cached
  get profileRequest(): Future<{ data: Profile }> | undefined {
    if (!this.session.isAuthenticated) {
      return undefined;
    }

    return this.store.request<{ data: Profile }>(profileQuery());
  }

  get profile(): Profile | undefined {
    const state = this.profileRequest
      ? getRequestState(this.profileRequest)
      : undefined;

    return state?.isSuccess ? responseData(state.value) : undefined;
  }

  // Listbox items can't be anchors, so the OAuth full-page exits go through
  // the menu's onAction; in-app targets use normal router transitions.
  @action
  handleAction(key: string) {
    switch (key) {
      case 'sign-in-google':
        window.location.assign(signInUrl('google'));
        break;
      case 'sign-in-facebook':
        window.location.assign(signInUrl('facebook'));
        break;
      case 'favorites':
        this.router.transitionTo('favorites');
        break;
      case 'sign-out':
        void this.session.invalidate();
        break;
    }
  }

  <template>
    <Dropdown @placement="bottom-end" as |d|>
      <d.Trigger
        aria-label={{t "auth.menu.label"}}
        data-test-navbar-auth
        @appearance="outlined"
        class="h-12"
      >
        {{#if this.profile.picture}}
          <img
            alt=""
            data-test-navbar-auth-avatar
            src={{this.profile.picture}}
            class="size-6 rounded-full"
          />
        {{else}}
          <User />
        {{/if}}
        {{#if this.profile.displayName}}
          <span
            class="hidden max-w-32 truncate text-sm font-medium md:inline"
            data-test-navbar-auth-name
          >
            {{this.profile.displayName}}
          </span>
        {{/if}}
      </d.Trigger>

      <d.Menu @onAction={{this.handleAction}} as |Item|>
        {{#if this.session.isAuthenticated}}
          <Item @key="favorites" data-test-navbar-auth-item="favorites">
            <:start><Star @size={{16}} /></:start>
            <:default>{{t "navigation.favorites"}}</:default>
          </Item>
          <Item @key="sign-out" data-test-navbar-auth-item="sign-out">
            <:start><SignOut @size={{16}} /></:start>
            <:default>{{t "auth.menu.signOut"}}</:default>
          </Item>
        {{else}}
          <Item
            @key="sign-in-google"
            data-test-navbar-auth-item="sign-in-google"
          >
            <:start><GoogleLogo @size={{16}} /></:start>
            <:default>{{t "auth.signIn.google"}}</:default>
          </Item>
          <Item
            @key="sign-in-facebook"
            data-test-navbar-auth-item="sign-in-facebook"
          >
            <:start><FacebookLogo @size={{16}} /></:start>
            <:default>{{t "auth.signIn.facebook"}}</:default>
          </Item>
        {{/if}}
      </d.Menu>
    </Dropdown>
  </template>
}
