import type { TOC } from '@ember/component/template-only';
import type { IconComponent } from 'winds-mobi-client-web/utils/icon-component';

export interface StationMetaItemSignature {
  Args: {
    icon?: IconComponent;
    label: string;
  };
  Blocks: {
    default: [];
  };
  Element: HTMLDivElement;
}

const StationMetaItem: TOC<StationMetaItemSignature> = <template>
  <div class="flex items-center gap-1.5">
    <dt class="sr-only">{{@label}}</dt>
    <dd class="m-0 inline-flex items-center gap-1.5" ...attributes>
      {{#if @icon}}
        <@icon @size={{14}} class="text-slate-400" />
      {{/if}}
      {{yield}}
    </dd>
  </div>
</template>;

export default StationMetaItem;
