import Component from '@glimmer/component';
import type Owner from '@ember/owner';
import { registerDestructor } from '@ember/destroyable';
import { tracked } from '@glimmer/tracking';
import { htmlSafe, type SafeString } from '@ember/template';
import { waitForPromise } from '@ember/test-waiters';
import { task } from 'ember-concurrency';
import { t } from 'ember-intl';

export interface HelpChangelogSignature {
  Args: Record<string, never>;
  Blocks: {
    default: [];
  };
  Element: HTMLElement;
}

export default class HelpChangelog extends Component<HelpChangelogSignature> {
  #abortController = new AbortController();

  @tracked renderedMarkdown?: SafeString;

  constructor(owner: Owner, args: HelpChangelogSignature['Args']) {
    super(owner, args);

    registerDestructor(this, () => this.#abortController.abort());
    void this.load.perform();
  }

  get isLoading() {
    return this.load.isRunning;
  }

  get error() {
    return this.load.last?.isError ?? false;
  }

  // Fetches the changelog and imports the markdown parser in parallel, rather
  // than one after the other, since neither depends on the other's result.
  // `waitForPromise` on the dynamic import, matching render-highcharts.ts,
  // so test helpers' `await settled()` waits for the chunk to load.
  load = task(async () => {
    const [response, { marked }] = await Promise.all([
      fetch('/CHANGELOG.md', { signal: this.#abortController.signal }),
      waitForPromise(import('marked')),
    ]);

    if (!response.ok) {
      throw new Error(`Unable to load changelog: ${response.status}`);
    }

    const markdown = await response.text();

    this.renderedMarkdown = htmlSafe(marked.parse(markdown, { async: false }));
  });

  <template>
    <div data-test-help-changelog>
      {{#if this.isLoading}}
        <p class="text-sm text-slate-500">{{t "help.changelog.loading"}}</p>
      {{else if this.error}}
        <p class="text-sm text-rose-700">{{t "help.changelog.error"}}</p>
      {{else if this.renderedMarkdown}}
        <div
          class="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-a:text-sky-700 prose-a:no-underline hover:prose-a:text-sky-800 hover:prose-a:underline prose-code:text-slate-900 prose-pre:rounded-xl prose-pre:border prose-pre:border-slate-200 prose-pre:bg-slate-950"
        >
          {{this.renderedMarkdown}}
        </div>
      {{/if}}
    </div>
  </template>
}
