import Component from '@glimmer/component';

export interface StationSectionCardSignature {
  Args: {
    contentClass?: string;
    title: string;
    titleClass?: string;
  };
  Blocks: {
    default: [];
  };
  Element: HTMLElement;
}

export default class StationSectionCard extends Component<StationSectionCardSignature> {
  <template>
    <section class="rounded-2xl border border-slate-200 bg-white p-3.5" ...attributes>
      <p
        class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 {{if @titleClass @titleClass}}"
      >
        {{@title}}
      </p>

      <div class="mt-3 {{if @contentClass @contentClass}}">
        {{yield}}
      </div>
    </section>
  </template>
}
