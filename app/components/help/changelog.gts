import Component from '@glimmer/component';
import { registerDestructor } from '@ember/destroyable';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { htmlSafe, type SafeString } from '@ember/template';
import { marked } from 'marked';
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

  @tracked markdown?: string;
  @tracked error = false;
  @tracked isLoading = true;

  constructor(owner: unknown, args: HelpChangelogSignature['Args']) {
    super(owner, args);

    registerDestructor(this, () => this.#abortController.abort());
    void this.load();
  }

  get renderedMarkdown(): SafeString | undefined {
    if (!this.markdown) {
      return undefined;
    }

    return htmlSafe(marked.parse(this.markdown, { async: false }));
  }

  @action
  async load() {
    try {
      const response = await fetch('/CHANGELOG.md', {
        signal: this.#abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Unable to load changelog: ${response.status}`);
      }

      this.markdown = await response.text();
      this.error = false;
    } catch {
      if (this.#abortController.signal.aborted) {
        return;
      }

      this.error = true;
    } finally {
      if (!this.#abortController.signal.aborted) {
        this.isLoading = false;
      }
    }
  }

  <template>
    <div>
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
