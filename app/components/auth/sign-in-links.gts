import { t } from 'ember-intl';
import FacebookLogo from 'ember-phosphor-icons/components/ph-facebook-logo';
import GoogleLogo from 'ember-phosphor-icons/components/ph-google-logo';
import { signInUrl } from 'winds-mobi-client-web/utils/user-api';
import type { TOC } from '@ember/component/template-only';

export interface AuthSignInLinksSignature {
  Args: Record<string, never>;
  Element: HTMLDivElement;
}

// Full-page anchors (not buttons): starting the OAuth flow deliberately
// leaves the app for the provider and returns via /auth/callback.
const AuthSignInLinks: TOC<AuthSignInLinksSignature> = <template>
  <div class="flex flex-wrap items-center gap-2" ...attributes>
    <a
      data-test-auth-sign-in="google"
      href={{signInUrl "google"}}
      class="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
    >
      <GoogleLogo @size={{16}} />
      {{t "auth.signIn.google"}}
    </a>

    <a
      data-test-auth-sign-in="facebook"
      href={{signInUrl "facebook"}}
      class="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
    >
      <FacebookLogo @size={{16}} />
      {{t "auth.signIn.facebook"}}
    </a>
  </div>
</template>;

export default AuthSignInLinks;
