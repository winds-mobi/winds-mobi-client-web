import Component from '@glimmer/component';
import { t } from 'ember-intl';
import config from 'winds-mobi-client-web/config/environment';
import { changelogUrlForVersion } from 'winds-mobi-client-web/utils/changelog-link';

export interface HelpChangelogSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: HTMLElement;
}

export default class HelpChangelog extends Component<HelpChangelogSignature> {
  get version() {
    return config.version;
  }

  get changelogUrl() {
    return changelogUrlForVersion(this.version);
  }

  <template>
    <div data-test-help-changelog class="text-sm text-slate-600">
      <p data-test-help-changelog-version>
        {{t "help.changelog.version" version=this.version}}
      </p>
      <a
        data-test-help-changelog-link
        class="underline decoration-slate-300 underline-offset-3 hover:text-slate-900 hover:decoration-slate-500"
        href={{this.changelogUrl}}
        target="_blank"
        rel="noopener noreferrer"
      >
        {{t "help.changelog.linkText"}}
      </a>
    </div>
  </template>
}
