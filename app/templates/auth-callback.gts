import { LinkTo } from '@ember/routing';
import { pageTitle } from 'ember-page-title';
import { t } from 'ember-intl';
import StationSectionCard from 'winds-mobi-client-web/components/station/section-card';
import { signInUrl } from 'winds-mobi-client-web/utils/user-api';
import type { AuthCallbackModel } from 'winds-mobi-client-web/routes/auth-callback';
import type { TOC } from '@ember/component/template-only';

interface AuthCallbackTemplateSignature {
  Args: {
    model: AuthCallbackModel;
  };
}

const AuthCallbackTemplate: TOC<AuthCallbackTemplateSignature> = <template>
  {{pageTitle (t "auth.callback.title")}}

  <section class="min-h-0 flex-1 overflow-y-auto bg-slate-200">
    <div class="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {{#if @model.failed}}
        <StationSectionCard
          data-test-auth-callback-error
          @title={{t "auth.callback.failedTitle"}}
          @titleClass="text-rose-700"
        >
          <div class="max-w-2xl">
            <p class="text-sm leading-6 text-slate-600">
              {{t "auth.callback.failed"}}
            </p>

            <div class="mt-4 flex flex-wrap items-center gap-2">
              <a
                data-test-auth-retry="google"
                href={{signInUrl "google"}}
                class="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                {{t "auth.signIn.google"}}
              </a>

              <a
                data-test-auth-retry="facebook"
                href={{signInUrl "facebook"}}
                class="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                {{t "auth.signIn.facebook"}}
              </a>

              <LinkTo
                @route="map"
                data-test-auth-back-to-map
                class="px-2 text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-3 transition hover:text-slate-900 hover:decoration-slate-500"
              >
                {{t "auth.callback.backToMap"}}
              </LinkTo>
            </div>
          </div>
        </StationSectionCard>
      {{else}}
        <StationSectionCard
          data-test-auth-callback-pending
          @title={{t "auth.callback.title"}}
        >
          <p class="py-10 text-center text-sm font-medium text-slate-500">
            {{t "auth.callback.pending"}}
          </p>
        </StationSectionCard>
      {{/if}}
    </div>
  </section>
</template>;

export default AuthCallbackTemplate;
